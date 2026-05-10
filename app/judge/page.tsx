'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RouteStatus {
  route_id: string; route_name: string; difficulty_points: number
  status: 'pending' | 'in_progress' | 'completed'; attempts: number
  points_awarded: number; category_id: number
}

interface Climber { climber_id: string; name: string; gender: string; category_name: string; category_id: number }
interface Me { judgeId: number; judgeName: string }

const STATUS_COLORS = {
  pending: 'bg-gray-100 border-gray-200',
  in_progress: 'bg-yellow-50 border-yellow-200',
  completed: 'bg-green-50 border-green-200',
}

export default function JudgePage() {
  const [me, setMe] = useState<Me | null>(null)
  const [climberId, setClimberId] = useState('')
  const [climber, setClimber] = useState<Climber | null>(null)
  const [routes, setRoutes] = useState<RouteStatus[]>([])
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.judgeId) setMe(data)
    })
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setClimber(null); setRoutes([])
    if (!climberId.trim()) return

    const res = await fetch(`/api/judge/climber/${climberId.trim()}`)
    const data = await res.json()
    if (!res.ok) { setError(data.message); return }
    setClimber(data)

    if (me) {
      const rRes = await fetch(`/api/judge/routes/${me.judgeId}/${climberId.trim()}`)
      const rData = await rRes.json()
      if (!rRes.ok) { setError(rData.message); return }
      setRoutes(rData)
    }
  }

  async function handleScore(route: RouteStatus, scoreType: 'top' | 'attempt') {
    if (route.status === 'completed') { toast.error('Already topped.'); return }
    setSubmitting(route.route_id)
    try {
      const res = await fetch('/api/judge/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          climber_id: climber!.climber_id,
          route_id: route.route_id,
          score_type: scoreType,
          judge_id: me!.judgeId,
          category_id: route.category_id,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success(scoreType === 'top' ? `Topped! ${data.result?.points_awarded} pts` : 'Attempt recorded.')

      // Refresh routes
      const rRes = await fetch(`/api/judge/routes/${me!.judgeId}/${climber!.climber_id}`)
      setRoutes(await rRes.json())
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Score Entry</h1>
        {me && <p className="text-sm text-muted-foreground mt-1">Logged in as {me.judgeName}</p>}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Enter Climber ID…"
          value={climberId}
          onChange={e => setClimberId(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit">Find</Button>
      </form>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {climber && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{climber.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-0.5">
            <p>ID: {climber.climber_id}</p>
            <p>Category: {climber.category_name} · {climber.gender}</p>
          </CardContent>
        </Card>
      )}

      {routes.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Your Routes</h2>
          <div className="grid gap-3">
            {routes.map(route => (
              <div key={route.route_id} className={`border rounded-lg p-4 ${STATUS_COLORS[route.status]}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-medium">Route {route.route_id}</span>
                    {route.route_name && <span className="text-muted-foreground ml-1">— {route.route_name}</span>}
                    <span className="text-xs text-muted-foreground ml-2">({route.difficulty_points} pts)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {route.attempts > 0 && <span className="text-xs text-muted-foreground">{route.attempts} attempt{route.attempts !== 1 ? 's' : ''}</span>}
                    <Badge variant={route.status === 'completed' ? 'default' : route.status === 'in_progress' ? 'secondary' : 'outline'}>
                      {route.status === 'completed' ? `✓ Topped (${route.points_awarded}pts)` : route.status === 'in_progress' ? 'In progress' : 'Pending'}
                    </Badge>
                  </div>
                </div>
                {route.status !== 'completed' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={!!submitting} onClick={() => handleScore(route, 'attempt')}>
                      {submitting === route.route_id ? '…' : 'Attempt'}
                    </Button>
                    <Button size="sm" disabled={!!submitting} onClick={() => handleScore(route, 'top')}>
                      {submitting === route.route_id ? '…' : 'Top ✓'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
