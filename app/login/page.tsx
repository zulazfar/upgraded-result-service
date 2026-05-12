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
    <div className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'var(--field-bg)' }}>
      <div className="w-full max-w-sm">

        {/* Brand ─────────────────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2.5 mb-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{
                background: 'var(--field-orange)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
              }}>
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2 10 L6 2 L10 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-2xl tracking-tight" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>
              ResultOS
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--field-muted)' }}>
            Competition Scoring System
          </p>
        </div>

        {/* Double-bezel card ─────────────────────────────────────────── */}
        {/* Outer shell — acts as the tray / frame */}
        <div style={{
          background: '#E3E6EB',
          borderRadius: '22px',
          padding: '5px',
          boxShadow: '0 8px 32px rgba(17,24,39,0.10), 0 2px 8px rgba(17,24,39,0.07), inset 0 1px 0 rgba(255,255,255,0.75)',
        }}>
          {/* Inner card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '17px',
            padding: '2rem',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.9)',
          }}>
            <h2 className="font-bold text-lg mb-6" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
              Sign in
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold" style={{ color: 'var(--field-text)' }}>
                  Username
                </label>
                <div style={{
                  background: 'var(--field-raised)',
                  borderRadius: '10px',
                  padding: '2px',
                  boxShadow: 'inset 0 1px 3px rgba(17,24,39,0.07)',
                }}>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required autoFocus autoComplete="username"
                    className="w-full px-3.5 py-2.5 text-sm outline-none"
                    style={{
                      background: 'transparent',
                      color: 'var(--field-text)',
                      fontFamily: 'inherit',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold" style={{ color: 'var(--field-text)' }}>
                  Password
                </label>
                <div style={{
                  background: 'var(--field-raised)',
                  borderRadius: '10px',
                  padding: '2px',
                  boxShadow: 'inset 0 1px 3px rgba(17,24,39,0.07)',
                }}>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required autoComplete="current-password"
                    className="w-full px-3.5 py-2.5 text-sm outline-none"
                    style={{
                      background: 'transparent',
                      color: 'var(--field-text)',
                      fontFamily: 'inherit',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 font-bold text-sm mt-2"
                style={{
                  background: loading ? 'var(--field-raised)' : 'var(--field-orange)',
                  color: loading ? 'var(--field-muted)' : '#fff',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.38), 0 1px 3px rgba(37,99,235,0.2)',
                  transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  letterSpacing: '-0.01em',
                }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 mt-7">
          <span className="text-xs font-medium" style={{ color: 'var(--field-muted)' }}>
            Judges → <code className="text-xs">/judge</code>
          </span>
          <span style={{ color: 'var(--field-border)' }}>·</span>
          <span className="text-xs font-medium" style={{ color: 'var(--field-muted)' }}>
            Leaderboard → <code className="text-xs">/leaderboard</code>
          </span>
        </div>
      </div>
    </div>
  )
}
