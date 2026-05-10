'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface RouteStatus {
  route_id: string; route_name: string; difficulty_points: number
  status: 'pending' | 'in_progress' | 'completed'; attempts: number
  points_awarded: number; category_id: number
}
interface Climber { climber_id: string; name: string; gender: string; category_name: string; category_id: number }
interface Me { judgeId: number; judgeName: string }

export default function JudgePage() {
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
        toast.success(`TOPPED — ${data.result?.points_awarded ?? ''}pts`)
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
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--field-border)', background: 'var(--field-surface)' }}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-5 rounded-sm" style={{ background: 'var(--field-orange)' }} />
          <span className="font-heading font-bold text-lg tracking-widest uppercase" style={{ color: 'var(--field-text)', letterSpacing: '0.14em' }}>Score Entry</span>
        </div>
        {me && (
          <span className="text-xs" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>
            {me.judgeName.toUpperCase()}
          </span>
        )}
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* ── Climber Search ─────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            ref={inputRef}
            value={climberId}
            onChange={e => setClimberId(e.target.value)}
            placeholder="CLIMBER ID"
            autoFocus
            className="flex-1 rounded-xl px-4 py-4 text-base uppercase outline-none transition-all"
            style={{
              background: 'var(--field-surface)',
              border: '1.5px solid var(--field-border)',
              color: 'var(--field-text)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              fontSize: '1rem',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--field-orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--field-border)'}
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-xl px-5 font-heading font-bold tracking-wider uppercase transition-all"
            style={{
              background: 'var(--field-orange)',
              color: '#fff',
              border: 'none',
              fontSize: '0.9rem',
              letterSpacing: '0.1em',
              minWidth: '72px',
              cursor: searching ? 'not-allowed' : 'pointer',
              opacity: searching ? 0.6 : 1,
            }}
          >
            {searching ? '…' : 'FIND'}
          </button>
        </form>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#2A0A0A', border: '1px solid #5A1A1A', color: '#FCA5A5', fontFamily: 'var(--font-mono)' }}>
            ✕ {error}
          </div>
        )}

        {/* ── Climber Card ───────────────────────────────────────────────── */}
        {climber && (
          <div className="rounded-xl px-5 py-4" style={{ background: 'var(--field-surface)', border: '1.5px solid var(--field-border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-heading font-bold text-2xl leading-tight" style={{ color: 'var(--field-text)', letterSpacing: '0.02em' }}>
                  {climber.name.toUpperCase()}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>{climber.climber_id}</span>
                  <span style={{ color: 'var(--field-border)' }}>·</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>{climber.category_name.toUpperCase()} · {climber.gender.toUpperCase()}</span>
                </div>
              </div>
              <button onClick={handleClear} className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--field-raised)', color: 'var(--field-muted)', border: '1px solid var(--field-border)', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                CLEAR
              </button>
            </div>
          </div>
        )}

        {/* ── All done banner ────────────────────────────────────────────── */}
        {allDone && (
          <div className="rounded-xl px-5 py-4 text-center" style={{ background: 'var(--field-green-dim)', border: '1.5px solid color-mix(in srgb, var(--field-green) 50%, transparent)' }}>
            <div className="font-heading font-bold text-xl" style={{ color: 'var(--field-green-text)', letterSpacing: '0.08em' }}>
              ✓ ALL ROUTES COMPLETE
            </div>
            <button onClick={handleClear} className="mt-3 px-6 py-2 rounded-lg font-heading font-bold text-sm tracking-wider uppercase transition-all"
              style={{ background: 'var(--field-orange)', color: '#fff', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}>
              NEXT CLIMBER
            </button>
          </div>
        )}

        {/* ── Route Cards ────────────────────────────────────────────────── */}
        {routes.length > 0 && !allDone && (
          <div className="space-y-3">
            <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>
              YOUR ROUTES
            </div>

            {routes.map(route => {
              const isSubmitting = submitting === route.route_id

              if (route.status === 'completed') {
                return (
                  <div key={route.route_id} className="route-topped">
                    <div>
                      <div className="font-heading font-bold text-sm" style={{ color: 'var(--field-green-text)', letterSpacing: '0.06em' }}>
                        ✓ TOPPED — {route.points_awarded}pts
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'color-mix(in srgb, var(--field-green-text) 60%, transparent)', fontFamily: 'var(--font-mono)' }}>
                        Route {route.route_id}{route.route_name ? ` — ${route.route_name}` : ''}
                      </div>
                    </div>
                    <div className="text-2xl">✓</div>
                  </div>
                )
              }

              return (
                <div key={route.route_id} className="rounded-xl p-4 space-y-3"
                  style={{ background: 'var(--field-surface)', border: `1.5px solid ${route.status === 'in_progress' ? 'color-mix(in srgb, var(--field-orange) 50%, transparent)' : 'var(--field-border)'}` }}>

                  {/* Route header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-heading font-bold text-lg" style={{ color: 'var(--field-text)', letterSpacing: '0.04em' }}>
                        ROUTE {route.route_id}
                      </span>
                      {route.route_name && (
                        <span className="text-sm ml-2" style={{ color: 'var(--field-muted)' }}>
                          {route.route_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {route.attempts > 0 && (
                        <span className="text-sm font-medium" style={{ color: 'var(--field-orange)', fontFamily: 'var(--font-mono)' }}>
                          {route.attempts} ATT
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>
                        {route.difficulty_points}pts
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="btn-attempt"
                      disabled={isSubmitting}
                      onClick={() => handleScore(route, 'attempt')}
                    >
                      {isSubmitting ? '…' : 'ATTEMPT'}
                    </button>
                    <button
                      className="btn-top"
                      disabled={isSubmitting}
                      onClick={() => handleScore(route, 'top')}
                    >
                      {isSubmitting ? '…' : <><span>TOP</span><span>✓</span></>}
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
