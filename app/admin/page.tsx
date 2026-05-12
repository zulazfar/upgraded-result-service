import Link from 'next/link'
import { Users, MapPin, ShieldCheck, BarChart2, Trophy, Zap } from 'lucide-react'

const cards = [
  { href: '/admin/athletes',    title: 'Athletes',    desc: 'Manage climbers and bulk import via CSV',   Icon: Users },
  { href: '/admin/routes',      title: 'Routes',      desc: 'Set up qualifier routes and point values',  Icon: MapPin },
  { href: '/admin/judges',      title: 'Judges',      desc: 'Create judge accounts and assign routes',   Icon: ShieldCheck },
  { href: '/admin/results',     title: 'Results',     desc: 'View and edit submitted scores',            Icon: BarChart2 },
  { href: '/admin/leaderboard', title: 'Leaderboard', desc: 'Live qualifier rankings by category',       Icon: Trophy },
  { href: '/admin/finals',      title: 'Finals',      desc: 'Manage finalists, routes, and scores',      Icon: Zap },
]

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>
          Admin
        </p>
        <h1 className="font-bold text-3xl"
          style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ href, title, desc, Icon }) => (
          <Link key={href} href={href} className="block">
            <div className="admin-card">
              {/* Icon */}
              <div className="mb-4 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'var(--field-orange-dim)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
                }}>
                <Icon strokeWidth={1.75} style={{ color: 'var(--field-orange)', width: '18px', height: '18px' }} />
              </div>

              <h3 className="font-bold text-base mb-1"
                style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--field-muted)' }}>
                {desc}
              </p>

              <div className="arrow-hint mt-4 flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'var(--field-orange)' }}>
                Open <span>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
