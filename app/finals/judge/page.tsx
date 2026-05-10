'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FinalsRoute { route_id: number; route_name: string }
interface FinalsClimber { climber_id: string; name: string; category: string; gender: string }
interface ScoreForm { is_top: boolean; is_zone: boolean; attempts_to_top: string; attempts_to_zone: string }

export default function FinalsJudgePage() {
  const [climberId, setClimberId] = useState('')
  const [climber, setClimber] = useState<FinalsClimber | null>(null)
  const [routes, setRoutes] = useState<FinalsRoute[]>([])
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())
  const [forms, setForms] = useState<Record<number, ScoreForm>>({})
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function loadSubmitted(cid: string) {
    const res = await fetch('/api/finals/score')
    // We'll track submitted locally after each submission
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setClimber(null)
    const res = await fetch(`/api/judge/climber/${climberId.trim()}`)
    const data = await res.json()
    if (!res.ok) {
      // Try finals climbers
      const fRes = await fetch('/api/finals/climbers')
      const fData: FinalsClimber[] = await fRes.json()
      const found = fData.find(c => c.climber_id.toLowerCase() === climberId.trim().toLowerCase())
      if (!found) { setError('Climber not found in finals.'); return }
      setClimber(found)
    } else {
      setClimber({ climber_id: data.climber_id, name: data.name, category: data.category_name, gender: data.gender })
    }

    const rRes = await fetch('/api/finals/routes')
    const rData: FinalsRoute[] = await rRes.json()
    setRoutes(rData)
    const initial: Record<number, ScoreForm> = {}
    rData.forEach(r => { initial[r.route_id] = { is_top: false, is_zone: false, attempts_to_top: '1', attempts_to_zone: '1' } })
    setForms(initial)
    setSubmitted(new Set())
  }

  function updateForm(routeId: number, field: keyof ScoreForm, value: boolean | string) {
    setForms(f => ({ ...f, [routeId]: { ...f[routeId], [field]: value } }))
  }

  async function handleSubmit(routeId: number) {
    const form = forms[routeId]
    setSubmitting(routeId)
    try {
      const res = await fetch('/api/finals/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          climber_id: climber!.climber_id,
          route_id: routeId,
          is_top: form.is_top,
          is_zone: form.is_zone,
          attempts_to_top: parseInt(form.attempts_to_top) || 0,
          attempts_to_zone: parseInt(form.attempts_to_zone) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success(`Score recorded: ${data.score} pts`)
      setSubmitted(s => new Set(s).add(String(routeId)))
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Finals Score Entry</h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input placeholder="Enter Climber ID…" value={climberId} onChange={e => setClimberId(e.target.value)} className="max-w-xs" />
          <Button type="submit">Find</Button>
        </form>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {climber && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">{climber.name}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{climber.category} · {climber.gender}</p>
            </CardContent>
          </Card>
        )}

        {climber && routes.map(route => {
          const form = forms[route.route_id] || { is_top: false, is_zone: false, attempts_to_top: '1', attempts_to_zone: '1' }
          const done = submitted.has(String(route.route_id))
          return (
            <Card key={route.route_id} className={done ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Route {route.route_id}{route.route_name ? ` — ${route.route_name}` : ''}</CardTitle>
                  {done && <Badge variant="default">Submitted</Badge>}
                </div>
              </CardHeader>
              {!done && (
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_top} onChange={e => { updateForm(route.route_id, 'is_top', e.target.checked); if (e.target.checked) updateForm(route.route_id, 'is_zone', true) }} />
                      <span className="text-sm font-medium">Top</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_zone} onChange={e => updateForm(route.route_id, 'is_zone', e.target.checked)} disabled={form.is_top} />
                      <span className="text-sm font-medium">Zone</span>
                    </label>
                  </div>
                  {form.is_top && <div><Label className="text-xs">Attempts to Top</Label><Input type="number" min={1} className="w-20 mt-1" value={form.attempts_to_top} onChange={e => updateForm(route.route_id, 'attempts_to_top', e.target.value)} /></div>}
                  {form.is_zone && !form.is_top && <div><Label className="text-xs">Attempts to Zone</Label><Input type="number" min={1} className="w-20 mt-1" value={form.attempts_to_zone} onChange={e => updateForm(route.route_id, 'attempts_to_zone', e.target.value)} /></div>}
                  <Button size="sm" disabled={submitting === route.route_id} onClick={() => handleSubmit(route.route_id)}>
                    {submitting === route.route_id ? 'Saving…' : 'Submit Score'}
                  </Button>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
