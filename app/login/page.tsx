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
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--field-bg)' }}>
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'var(--field-orange)' }} />
            <span className="font-bold text-2xl tracking-tight" style={{ color: 'var(--field-text)' }}>
              ResultOS
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--field-muted)' }}>Competition Scoring System</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-7" style={{ border: '1px solid var(--field-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {/* Orange accent bar */}
          <div className="h-1 rounded-full mb-6" style={{ background: 'var(--field-orange)', width: '32px' }} />

          <h2 className="font-bold text-xl mb-6" style={{ color: 'var(--field-text)' }}>Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--field-text)' }}>
                Username
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                required autoFocus autoComplete="username"
                className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all"
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--field-border)',
                  color: 'var(--field-text)',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--field-orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--field-border)'}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--field-text)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
                className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all"
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--field-border)',
                  color: 'var(--field-text)',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--field-orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--field-border)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 font-bold text-base transition-all mt-2"
              style={{
                background: loading ? 'var(--field-raised)' : 'var(--field-orange)',
                color: loading ? 'var(--field-muted)' : '#fff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px color-mix(in srgb, var(--field-orange) 35%, transparent)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'var(--field-muted)' }}>
          Judges → /judge &nbsp;·&nbsp; Leaderboard → /leaderboard
        </p>
      </div>
    </div>
  )
}
