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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
