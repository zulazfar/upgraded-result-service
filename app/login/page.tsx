'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      router.push(data.isSuperAdmin ? '/admin' : '/judge')
    } catch {
      toast.error('Login failed. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="field-page flex items-center justify-center px-4">
      {/* Background grid texture */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(var(--field-border) 1px, transparent 1px), linear-gradient(90deg, var(--field-border) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-sm relative">
        {/* Brand mark */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="inline-block w-3 h-8 rounded-sm" style={{ background: 'var(--field-orange)' }} />
            <span className="font-heading text-3xl font-bold tracking-widest uppercase" style={{ color: 'var(--field-text)', letterSpacing: '0.2em' }}>
              ResultOS
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            COMPETITION SCORING SYSTEM
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--field-surface)', border: '1px solid var(--field-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>
                Username
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                required autoFocus autoComplete="username"
                className="w-full rounded-lg px-4 py-3 text-base outline-none transition-all"
                style={{
                  background: 'var(--field-raised)',
                  border: '1.5px solid var(--field-border)',
                  color: 'var(--field-text)',
                  fontFamily: 'var(--font-mono)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--field-orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--field-border)'}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
                className="w-full rounded-lg px-4 py-3 text-base outline-none transition-all"
                style={{
                  background: 'var(--field-raised)',
                  border: '1.5px solid var(--field-border)',
                  color: 'var(--field-text)',
                  fontFamily: 'var(--font-mono)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--field-orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--field-border)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3.5 font-heading text-base font-bold tracking-widest uppercase transition-all"
              style={{
                background: loading ? 'var(--field-raised)' : 'var(--field-orange)',
                color: loading ? 'var(--field-muted)' : '#fff',
                border: 'none',
                letterSpacing: '0.12em',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 24px color-mix(in srgb, var(--field-orange) 40%, transparent)',
              }}
            >
              {loading ? 'SIGNING IN…' : 'SIGN IN'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>
          JUDGES → /judge &nbsp;·&nbsp; LEADERBOARD → /leaderboard
        </p>
      </div>
    </div>
  )
}
