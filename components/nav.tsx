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
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--field-orange)' }} />
            <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--field-text)' }}>
              {title}
            </span>
          </div>

          {/* Divider */}
          <span className="h-4 w-px shrink-0" style={{ background: 'var(--field-border)' }} />

          {/* Nav links */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {links.map(link => {
              const active = pathname === link.href
              return (
                <Link key={link.href} href={link.href}
                  className="px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors"
                  style={{
                    background: active ? 'var(--field-orange-dim)' : 'transparent',
                    color: active ? 'var(--field-orange)' : 'var(--field-muted)',
                    fontWeight: active ? 600 : 400,
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
                background: pathname === settingsHref ? 'var(--field-orange-dim)' : 'transparent',
              }}>
              <Settings className="w-3.5 h-3.5" />
            </Link>
          )}
          <button onClick={handleLogout}
            className="px-3 py-1.5 rounded-md text-sm transition-colors"
            style={{
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
