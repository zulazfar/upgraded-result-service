import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const cards = [
  { href: '/admin/athletes',    title: 'Athletes',    desc: 'Manage climbers, bulk import via CSV' },
  { href: '/admin/routes',      title: 'Routes',      desc: 'Set up qualifier routes and point values' },
  { href: '/admin/judges',      title: 'Judges',      desc: 'Create judge accounts and assign routes' },
  { href: '/admin/results',     title: 'Results',     desc: 'View and edit submitted scores' },
  { href: '/admin/leaderboard', title: 'Leaderboard', desc: 'Live qualifier rankings by category' },
  { href: '/admin/finals',      title: 'Finals',      desc: 'Manage finals climbers, routes, and scores' },
]

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-6 tracking-wide uppercase" style={{ color: 'var(--field-text)', letterSpacing: '0.08em', fontFamily: 'var(--font-heading, "Barlow Condensed", sans-serif)' }}>Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full transition-all cursor-pointer hover:border-[var(--field-orange)] hover:shadow-[0_0_16px_color-mix(in_srgb,var(--field-orange)_12%,transparent)]" style={{ background: 'var(--field-surface)', border: '1px solid var(--field-border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-heading font-bold tracking-widest uppercase" style={{ fontFamily: 'var(--font-heading, "Barlow Condensed", sans-serif)', letterSpacing: '0.1em', color: 'var(--field-text)' }}>{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: 'var(--field-muted)' }}>{card.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
