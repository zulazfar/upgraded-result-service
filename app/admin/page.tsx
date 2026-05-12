import Link from 'next/link'
import { Users, MapPin, ShieldCheck, BarChart2, Trophy, Zap } from 'lucide-react'

const cards = [
  { href: '/admin/athletes',    title: 'Athletes',    desc: 'Manage climbers and bulk import via CSV',        Icon: Users },
  { href: '/admin/routes',      title: 'Routes',      desc: 'Set up qualifier routes and point values',       Icon: MapPin },
  { href: '/admin/judges',      title: 'Judges',      desc: 'Create judge accounts and assign routes',        Icon: ShieldCheck },
  { href: '/admin/results',     title: 'Results',     desc: 'View and edit submitted scores',                 Icon: BarChart2 },
  { href: '/admin/leaderboard', title: 'Leaderboard', desc: 'Live qualifier rankings by category',            Icon: Trophy },
  { href: '/admin/finals',      title: 'Finals',      desc: 'Manage finalists, routes, and scores',           Icon: Zap },
]

export default function AdminDashboard() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>
          Admin
        </p>
        <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ href, title, desc, Icon }) => (
          <Link key={href} href={href} className="group block">
            <div
              className="h-full p-5 rounded-2xl"
              style={{
                background: '#fff',
                boxShadow: 'var(--shadow-sm)',
                transition: 'box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = '0 8px 28px rgba(37,99,235,0.10), 0 2px 8px rgba(37,99,235,0.07), 0 0 0 1.5px rgba(37,99,235,0.15)'
                el.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = 'var(--shadow-sm)'
                el.style.transform = 'translateY(0)'
              }}
            >
              {/* Icon container */}
              <div className="mb-4 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'var(--field-orange-dim)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
                  transition: 'background 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                <Icon
                  className="w-4.5 h-4.5"
                  strokeWidth={1.75}
                  style={{ color: 'var(--field-orange)', width: '18px', height: '18px' }}
                />
              </div>

              {/* Text */}
              <h3 className="font-bold text-base mb-1" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--field-muted)' }}>
                {desc}
              </p>

              {/* Arrow indicator */}
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'var(--field-orange)', opacity: 0, transition: 'opacity 160ms' }}
                ref={el => {
                  if (!el) return
                  const card = el.closest('a')
                  card?.addEventListener('mouseenter', () => { el.style.opacity = '1' })
                  card?.addEventListener('mouseleave', () => { el.style.opacity = '0' })
                }}>
                Open <span style={{ marginLeft: '2px' }}>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
