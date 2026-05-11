import { Nav } from '@/components/nav'
import { requireAdmin } from '@/lib/auth'

const ADMIN_LINKS = [
  { href: '/admin',             label: 'Dashboard' },
  { href: '/admin/athletes',    label: 'Athletes' },
  { href: '/admin/routes',      label: 'Routes' },
  { href: '/admin/judges',      label: 'Judges' },
  { href: '/admin/results',     label: 'Results' },
  { href: '/admin/leaderboard', label: 'Leaderboard' },
  { href: '/admin/finals',      label: 'Finals' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="dark min-h-screen" style={{ background: 'var(--field-bg)', fontFamily: 'var(--font-body, Barlow, sans-serif)' }}>
      <Nav links={ADMIN_LINKS} title="Admin" settingsHref="/admin/settings" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
