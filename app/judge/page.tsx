'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RouteStatus {
  route_id: string; route_name: string; difficulty_points: number
  status: 'pending' | 'in_progress' | 'completed'; attempts: number
  points_awarded: number; category_id: number
}
interface Climber { climber_id: string; name: string; gender: string; category_name: string; category_id: number }
interface Me { judgeId: number; judgeName: string }

export default function JudgePage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [climberId, setClimberId] = useState('')
  const [climber, setClimber] = useState<Climber | null>(null)
  const [routes, setRoutes] = useState<RouteStatus[]>([])
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => { if (data.judgeId) setMe(data) })
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!climberId.trim()) return
    setError(''); setClimber(null); setRoutes([]); setSearching(true)
    try {
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
    } finally {
      setSearching(false)
    }
  }

  async function handleScore(route: RouteStatus, scoreType: 'top' | 'attempt') {
    if (route.status === 'completed') return
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
      if (scoreType === 'top') {
        toast.success(`Topped — ${data.result?.points_awarded ?? ''}pts`)
      } else {
        toast.info('Attempt recorded')
      }
      const rRes = await fetch(`/api/judge/routes/${me!.judgeId}/${climber!.climber_id}`)
      setRoutes(await rRes.json())
    } finally {
      setSubmitting(null)
    }
  }

  function handleClear() {
    setClimber(null); setRoutes([]); setError(''); setClimberId('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const allDone = routes.length > 0 && routes.every(r => r.status === 'completed')

  return (
    <div className="field-page">

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        boxShadow: '0 1px 0 rgba(17,24,39,0.06), 0 4px 16px rgba(17,24,39,0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div className="flex items-center justify-between px-4" style={{ height: '52px' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-6 h-6 rounded-md"
              style={{ background: 'var(--field-orange)', boxShadow: '0 2px 6px rgba(37,99,235,0.3)' }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 10 L6 2 L10 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
              Score Entry
            </span>
          </div>
          <div className="flex items-center gap-3">
            {me && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--field-raised)', color: 'var(--field-muted)' }}>
                {me.judgeName}
              </span>
            )}
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{
                color: 'var(--field-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 160ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--field-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--field-muted)')}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">

        {/* ── Search ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1" style={{
            background: '#fff',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <input
              ref={inputRef}
              value={climberId}
              onChange={e => setClimberId(e.target.value.toUpperCase())}
              placeholder="Climber ID"
              autoFocus
              className="w-full px-4 py-4 text-base outline-none"
              style={{
                background: 'transparent',
                color: 'var(--field-text)',
                fontFamily: 'inherit',
                fontWeight: 500,
                borderRadius: '14px',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="rounded-2xl px-5 font-bold text-sm"
            style={{
              background: 'var(--field-orange)',
              color: '#fff',
              border: 'none',
              minWidth: '72px',
              cursor: searching ? 'not-allowed' : 'pointer',
              opacity: searching ? 0.6 : 1,
              boxShadow: searching ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
              transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {searching ? '…' : 'Find'}
          </button>
        </form>

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: '#FEF2F2', border: 'none', boxShadow: '0 0 0 1px rgba(239,68,68,0.2)', color: '#DC2626' }}>
            {error}
          </div>
        )}

        {/* ── Climber card ───────────────────────────────────────────── */}
        {climber && (
          <div className="px-5 py-4" style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-xl leading-tight" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
                  {climber.name}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md"
                    style={{ background: 'var(--field-raised)', color: 'var(--field-muted)' }}>
                    {climber.climber_id}
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--field-muted)' }}>
                    {climber.category_name} · {climber.gender}
                  </span>
                </div>
              </div>
              <button onClick={handleClear}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{
                  background: 'var(--field-raised)',
                  color: 'var(--field-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ── All done ───────────────────────────────────────────────── */}
        {allDone && (
          <div className="px-5 py-5 text-center" style={{
            background: 'var(--field-green-dim)',
            borderRadius: '16px',
            boxShadow: '0 0 0 1.5px rgba(22,163,74,0.2), 0 4px 16px rgba(22,163,74,0.08)',
          }}>
            <div className="font-bold text-lg" style={{ color: 'var(--field-green-text)', letterSpacing: '-0.01em' }}>
              All routes complete ✓
            </div>
            <button onClick={handleClear}
              className="mt-3 px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{
                background: 'var(--field-orange)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
              Next climber →
            </button>
          </div>
        )}

        {/* ── Route cards ────────────────────────────────────────────── */}
        {routes.length > 0 && !allDone && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: 'var(--field-muted)' }}>
              Assigned routes
            </p>

            {routes.map(route => {
              const isSubmitting = submitting === route.route_id

              if (route.status === 'completed') {
                return (
                  <div key={route.route_id} className="route-topped">
                    <div>
                      <div className="font-bold text-sm" style={{ color: 'var(--field-green-text)' }}>
                        Topped — {route.points_awarded}pts ✓
                      </div>
                      <div className="text-xs mt-0.5 font-medium" style={{ color: 'color-mix(in srgb, var(--field-green-text) 65%, transparent)' }}>
                        Route {route.route_id}{route.route_name ? ` · ${route.route_name}` : ''}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(22,163,74,0.12)', color: 'var(--field-green-text)', fontSize: '0.9rem' }}>
                      ✓
                    </div>
                  </div>
                )
              }

              return (
                <div key={route.route_id} className="p-4 space-y-3" style={{
                  background: '#fff',
                  borderRadius: '16px',
                  boxShadow: route.status === 'in_progress'
                    ? '0 0 0 2px rgba(37,99,235,0.25), 0 4px 16px rgba(37,99,235,0.08)'
                    : 'var(--shadow-sm)',
                }}>
                  {/* Route header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-base" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
                        Route {route.route_id}
                      </span>
                      {route.route_name && (
                        <span className="text-sm" style={{ color: 'var(--field-muted)' }}>
                          {route.route_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {route.attempts > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--field-orange-dim)', color: 'var(--field-orange)' }}>
                          {route.attempts} att
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--field-raised)', color: 'var(--field-muted)' }}>
                        {route.difficulty_points}pts
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn-attempt" disabled={isSubmitting} onClick={() => handleScore(route, 'attempt')}>
                      {isSubmitting ? '…' : 'Attempt'}
                    </button>
                    <button className="btn-top" disabled={isSubmitting} onClick={() => handleScore(route, 'top')}>
                      {isSubmitting ? '…' : <><span>Top</span><span style={{ opacity: 0.8 }}>✓</span></>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
