'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'

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
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setClimber(null); setSearching(true)
    try {
      const res = await fetch(`/api/judge/climber/${climberId.trim()}`)
      const data = await res.json()
      if (!res.ok) {
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
    } finally {
      setSearching(false)
    }
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
      toast.success(`Recorded — ${data.score}pts`)
      setSubmitted(s => new Set(s).add(String(routeId)))
    } finally {
      setSubmitting(null)
    }
  }

  function handleClear() {
    setClimber(null); setRoutes([]); setError(''); setClimberId(''); setSubmitted(new Set())
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const allDone = routes.length > 0 && routes.every(r => submitted.has(String(r.route_id)))

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
              Finals Scoring
            </span>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
              background: 'var(--field-orange-dim)',
              color: 'var(--field-orange)',
              letterSpacing: '0.04em',
            }}>
            FINALS
          </span>
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
          <button type="submit" disabled={searching}
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
            }}>
            {searching ? '…' : 'Find'}
          </button>
        </form>

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: '#FEF2F2', boxShadow: '0 0 0 1px rgba(239,68,68,0.2)', color: '#DC2626' }}>
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
                    {climber.category} · {climber.gender}
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
              All routes submitted ✓
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

        {/* ── Route forms ────────────────────────────────────────────── */}
        {climber && routes.map(route => {
          const form = forms[route.route_id] || { is_top: false, is_zone: false, attempts_to_top: '1', attempts_to_zone: '1' }
          const done = submitted.has(String(route.route_id))
          const isSubmitting = submitting === route.route_id

          if (done) {
            return (
              <div key={route.route_id} className="route-topped">
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--field-green-text)' }}>
                    Submitted ✓
                  </div>
                  <div className="text-xs mt-0.5 font-medium"
                    style={{ color: 'color-mix(in srgb, var(--field-green-text) 65%, transparent)' }}>
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
            <div key={route.route_id} className="p-4 space-y-4" style={{
              background: '#fff',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Route name */}
              <div>
                <span className="font-bold text-base" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
                  Route {route.route_id}
                </span>
                {route.route_name && (
                  <span className="text-sm ml-2" style={{ color: 'var(--field-muted)' }}>
                    {route.route_name}
                  </span>
                )}
              </div>

              {/* TOP / ZONE toggles */}
              <div className="grid grid-cols-2 gap-2">
                {/* TOP */}
                <button
                  onClick={() => {
                    updateForm(route.route_id, 'is_top', !form.is_top)
                    if (!form.is_top) updateForm(route.route_id, 'is_zone', true)
                  }}
                  className="rounded-2xl py-4 font-bold text-base"
                  style={{
                    background: form.is_top ? 'var(--field-orange)' : '#fff',
                    border: 'none',
                    color: form.is_top ? '#fff' : 'var(--field-muted)',
                    cursor: 'pointer',
                    boxShadow: form.is_top
                      ? '0 4px 16px rgba(37,99,235,0.38), 0 1px 4px rgba(37,99,235,0.2)'
                      : 'var(--shadow-sm)',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                  Top ✓
                </button>
                {/* ZONE */}
                <button
                  disabled={form.is_top}
                  onClick={() => updateForm(route.route_id, 'is_zone', !form.is_zone)}
                  className="rounded-2xl py-4 font-bold text-base"
                  style={{
                    background: form.is_zone ? '#F0FDFA' : '#fff',
                    border: 'none',
                    color: form.is_zone ? '#0D9488' : 'var(--field-muted)',
                    cursor: form.is_top ? 'not-allowed' : 'pointer',
                    opacity: form.is_top ? 0.45 : 1,
                    boxShadow: form.is_zone
                      ? '0 0 0 1.5px rgba(13,148,136,0.35), 0 4px 14px rgba(13,148,136,0.12)'
                      : 'var(--shadow-sm)',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                  Zone
                </button>
              </div>

              {/* Attempt count inputs */}
              {form.is_top && (
                <div className="flex items-center gap-3 px-1">
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--field-muted)' }}>
                    Attempts to top
                  </span>
                  <div style={{
                    background: 'var(--field-raised)',
                    borderRadius: '10px',
                    boxShadow: 'inset 0 1px 3px rgba(17,24,39,0.07)',
                  }}>
                    <input type="number" min={1} value={form.attempts_to_top}
                      onChange={e => updateForm(route.route_id, 'attempts_to_top', e.target.value)}
                      className="w-20 px-3 py-2 text-center outline-none text-sm font-bold"
                      style={{
                        background: 'transparent',
                        color: 'var(--field-text)',
                        fontFamily: 'inherit',
                        borderRadius: '10px',
                      }} />
                  </div>
                </div>
              )}
              {form.is_zone && !form.is_top && (
                <div className="flex items-center gap-3 px-1">
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--field-muted)' }}>
                    Attempts to zone
                  </span>
                  <div style={{
                    background: 'var(--field-raised)',
                    borderRadius: '10px',
                    boxShadow: 'inset 0 1px 3px rgba(17,24,39,0.07)',
                  }}>
                    <input type="number" min={1} value={form.attempts_to_zone}
                      onChange={e => updateForm(route.route_id, 'attempts_to_zone', e.target.value)}
                      className="w-20 px-3 py-2 text-center outline-none text-sm font-bold"
                      style={{
                        background: 'transparent',
                        color: 'var(--field-text)',
                        fontFamily: 'inherit',
                        borderRadius: '10px',
                      }} />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                className="btn-top"
                disabled={isSubmitting || (!form.is_top && !form.is_zone)}
                onClick={() => handleSubmit(route.route_id)}
                style={{ opacity: (!form.is_top && !form.is_zone) ? 0.35 : 1 }}>
                {isSubmitting ? 'Saving…' : 'Submit score'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
