'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Settings } from 'lucide-react'

interface NavProps {
  links: { href: string; label: string }[]
  title: string
  settingsHref?: string
}

export function Nav({ links, title, settingsHref }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    toast.success('Logged out.')
  }

  return (
    <nav style={{ background: 'var(--field-surface)', borderBottom: '1px solid var(--field-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12">

        {/* Left: brand + links */}
        <div className="flex items-center gap-5 min-w-0">
          {/* Brand mark */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-block w-1 h-4 rounded-sm" style={{ background: 'var(--field-orange)' }} />
            <span className="font-heading font-bold text-xs tracking-widest uppercase"
              style={{ color: 'var(--field-text)', letterSpacing: '0.18em', fontFamily: 'var(--font-heading, "Barlow Condensed", sans-serif)' }}>
              {title}
            </span>
          </div>

          {/* Divider */}
          <span className="h-4 w-px shrink-0" style={{ background: 'var(--field-border)' }} />

          {/* Nav links — scrollable on mobile */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {links.map(link => {
              const active = pathname === link.href
              return (
                <Link key={link.href} href={link.href}
                  className="px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors"
                  style={{
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                    letterSpacing: '0.06em',
                    background: active ? 'var(--field-raised)' : 'transparent',
                    color: active ? 'var(--field-orange)' : 'var(--field-muted)',
                    fontWeight: active ? 600 : 400,
                    borderBottom: active ? '2px solid var(--field-orange)' : '2px solid transparent',
                  }}>
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right: settings + logout */}
        <div className="flex items-center gap-1 shrink-0">
          {settingsHref && (
            <Link href={settingsHref} title="Settings"
              className="p-2 rounded-md transition-colors"
              style={{
                color: pathname === settingsHref ? 'var(--field-orange)' : 'var(--field-muted)',
                background: pathname === settingsHref ? 'var(--field-raised)' : 'transparent',
              }}>
              <Settings className="w-3.5 h-3.5" />
            </Link>
          )}
          <button onClick={handleLogout}
            className="px-3 py-1.5 rounded-md text-xs transition-colors"
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.06em',
              color: 'var(--field-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--field-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--field-muted)')}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
