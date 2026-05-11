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
      toast.success(`RECORDED — ${data.score}pts`)
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
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--field-border)', background: 'var(--field-surface)' }}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-5 rounded-sm" style={{ background: 'var(--field-orange)' }} />
          <span className="font-heading font-bold text-lg tracking-widest uppercase" style={{ color: 'var(--field-text)', letterSpacing: '0.14em' }}>Finals Scoring</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'var(--field-orange-dim)', color: 'var(--field-orange)', fontFamily: 'var(--font-mono)' }}>FINALS</span>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            ref={inputRef}
            value={climberId}
            onChange={e => setClimberId(e.target.value)}
            placeholder="CLIMBER ID"
            autoFocus
            className="flex-1 rounded-xl px-4 py-4 text-base uppercase outline-none transition-all"
            style={{ background: 'var(--field-surface)', border: '1.5px solid var(--field-border)', color: 'var(--field-text)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
            onFocus={e => e.target.style.borderColor = 'var(--field-orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--field-border)'}
          />
          <button type="submit" disabled={searching}
            className="rounded-xl px-5 font-heading font-bold tracking-wider uppercase"
            style={{ background: 'var(--field-orange)', color: '#fff', border: 'none', fontSize: '0.9rem', letterSpacing: '0.1em', minWidth: '72px', cursor: searching ? 'not-allowed' : 'pointer', opacity: searching ? 0.6 : 1 }}>
            {searching ? '…' : 'FIND'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            ✕ {error}
          </div>
        )}

        {/* Climber card */}
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
                  <span className="text-xs" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>{climber.category.toUpperCase()} · {climber.gender.toUpperCase()}</span>
                </div>
              </div>
              <button onClick={handleClear} className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--field-raised)', color: 'var(--field-muted)', border: '1px solid var(--field-border)', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                CLEAR
              </button>
            </div>
          </div>
        )}

        {/* All done */}
        {allDone && (
          <div className="rounded-xl px-5 py-4 text-center" style={{ background: 'var(--field-green-dim)', border: '1.5px solid color-mix(in srgb, var(--field-green) 50%, transparent)' }}>
            <div className="font-heading font-bold text-xl" style={{ color: 'var(--field-green-text)', letterSpacing: '0.08em' }}>✓ ALL ROUTES SUBMITTED</div>
            <button onClick={handleClear} className="mt-3 px-6 py-2 rounded-lg font-heading font-bold text-sm uppercase"
              style={{ background: 'var(--field-orange)', color: '#fff', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}>
              NEXT CLIMBER
            </button>
          </div>
        )}

        {/* Route forms */}
        {climber && routes.map(route => {
          const form = forms[route.route_id] || { is_top: false, is_zone: false, attempts_to_top: '1', attempts_to_zone: '1' }
          const done = submitted.has(String(route.route_id))
          const isSubmitting = submitting === route.route_id

          if (done) {
            return (
              <div key={route.route_id} className="route-topped">
                <div>
                  <div className="font-heading font-bold text-sm" style={{ color: 'var(--field-green-text)', letterSpacing: '0.06em' }}>✓ SUBMITTED</div>
                  <div className="text-xs mt-0.5" style={{ color: 'color-mix(in srgb, var(--field-green-text) 60%, transparent)', fontFamily: 'var(--font-mono)' }}>
                    Route {route.route_id}{route.route_name ? ` — ${route.route_name}` : ''}
                  </div>
                </div>
                <div className="text-2xl" style={{ color: 'var(--field-green-text)' }}>✓</div>
              </div>
            )
          }

          return (
            <div key={route.route_id} className="rounded-xl p-4 space-y-4" style={{ background: 'var(--field-surface)', border: '1.5px solid var(--field-border)' }}>
              <div className="font-heading font-bold text-lg" style={{ color: 'var(--field-text)', letterSpacing: '0.04em' }}>
                ROUTE {route.route_id}
                {route.route_name && <span className="text-sm font-normal ml-2" style={{ color: 'var(--field-muted)' }}>{route.route_name}</span>}
              </div>

              {/* TOP / ZONE toggles */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { updateForm(route.route_id, 'is_top', !form.is_top); if (!form.is_top) updateForm(route.route_id, 'is_zone', true) }}
                  className="rounded-xl py-4 font-heading font-bold text-base uppercase tracking-wider transition-all"
                  style={{ background: form.is_top ? 'var(--field-orange)' : 'var(--field-raised)', border: `1.5px solid ${form.is_top ? 'var(--field-orange)' : 'var(--field-border)'}`, color: form.is_top ? '#fff' : 'var(--field-muted)', cursor: 'pointer', letterSpacing: '0.1em', boxShadow: form.is_top ? '0 0 16px color-mix(in srgb, var(--field-orange) 35%, transparent)' : 'none' }}>
                  TOP ✓
                </button>
                <button disabled={form.is_top} onClick={() => updateForm(route.route_id, 'is_zone', !form.is_zone)}
                  className="rounded-xl py-4 font-heading font-bold text-base uppercase tracking-wider transition-all"
                  style={{ background: form.is_zone ? '#F0FDFA' : 'var(--field-raised)', border: `1.5px solid ${form.is_zone ? '#0D9488' : 'var(--field-border)'}`, color: form.is_zone ? '#0D9488' : 'var(--field-muted)', cursor: form.is_top ? 'not-allowed' : 'pointer', letterSpacing: '0.1em', opacity: form.is_top ? 0.5 : 1 }}>
                  ZONE
                </button>
              </div>

              {/* Attempt count inputs */}
              {form.is_top && (
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)', minWidth: 100 }}>Att. to Top</span>
                  <input type="number" min={1} value={form.attempts_to_top}
                    onChange={e => updateForm(route.route_id, 'attempts_to_top', e.target.value)}
                    className="w-20 rounded-lg px-3 py-2 text-center outline-none"
                    style={{ background: 'var(--field-raised)', border: '1.5px solid var(--field-border)', color: 'var(--field-text)', fontFamily: 'var(--font-mono)', fontSize: '1rem' }} />
                </div>
              )}
              {form.is_zone && !form.is_top && (
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)', minWidth: 100 }}>Att. to Zone</span>
                  <input type="number" min={1} value={form.attempts_to_zone}
                    onChange={e => updateForm(route.route_id, 'attempts_to_zone', e.target.value)}
                    className="w-20 rounded-lg px-3 py-2 text-center outline-none"
                    style={{ background: 'var(--field-raised)', border: '1.5px solid var(--field-border)', color: 'var(--field-text)', fontFamily: 'var(--font-mono)', fontSize: '1rem' }} />
                </div>
              )}

              <button className="btn-top" disabled={isSubmitting || (!form.is_top && !form.is_zone)} onClick={() => handleSubmit(route.route_id)}
                style={{ opacity: (!form.is_top && !form.is_zone) ? 0.4 : 1 }}>
                {isSubmitting ? 'SAVING…' : 'SUBMIT SCORE'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
