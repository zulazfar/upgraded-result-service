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
    <nav style={{
      background: '#fff',
      boxShadow: '0 1px 0 rgba(17,24,39,0.07), 0 4px 16px rgba(17,24,39,0.04)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-13" style={{ height: '52px' }}>

        {/* Brand */}
        <div className="flex items-center gap-5 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-md" style={{ background: 'var(--field-orange)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 10 L6 2 L10 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
              {title}
            </span>
          </div>

          <span className="h-4 w-px shrink-0" style={{ background: 'var(--field-border)' }} />

          {/* Nav links */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {links.map(link => {
              const active = pathname === link.href
              return (
                <Link key={link.href} href={link.href}
                  className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
                  style={{
                    background: active ? 'var(--field-orange-dim)' : 'transparent',
                    color: active ? 'var(--field-orange)' : 'var(--field-muted)',
                    fontWeight: active ? 600 : 400,
                    transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
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
              className="p-2 rounded-lg transition-all"
              style={{
                color: pathname === settingsHref ? 'var(--field-orange)' : 'var(--field-muted)',
                background: pathname === settingsHref ? 'var(--field-orange-dim)' : 'transparent',
                transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
              <Settings className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          )}
          <button onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-sm"
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
    </nav>
  )
}
