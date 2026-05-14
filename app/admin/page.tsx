import Link from 'next/link'
import { Users, MapPin, ShieldCheck, BarChart2, Trophy, Zap } from 'lucide-react'
import { db } from '@/lib/db'

async function getStats() {
  try {
    const [climbers, routes, judges, results] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM climbers'),
      db.query('SELECT COUNT(*)::int AS count FROM routes'),
      db.query('SELECT COUNT(*)::int AS count FROM judges WHERE is_superadmin = false'),
      db.query('SELECT COUNT(*)::int AS count FROM results'),
    ])
    return {
      climberCount: climbers.rows[0].count as number,
      routeCount:   routes.rows[0].count as number,
      judgeCount:   judges.rows[0].count as number,
      resultCount:  results.rows[0].count as number,
    }
  } catch {
    return { climberCount: 0, routeCount: 0, judgeCount: 0, resultCount: 0 }
  }
}

type TopAthlete = { name: string; total_points: number }
type CategoryTop3 = { category_id: number; category_name: string; athletes: TopAthlete[] }

async function getTop3PerCategory(): Promise<CategoryTop3[]> {
  try {
    const res = await db.query(`
      WITH LatestScores AS (
        SELECT r.climber_id, r.route_id, r.points_awarded, r.category_id,
          ROW_NUMBER() OVER (PARTITION BY r.climber_id, r.route_id ORDER BY r.timestamp DESC) AS rn
        FROM results r
      ),
      FinalScores AS (SELECT * FROM LatestScores WHERE rn = 1),
      RankedScores AS (
        SELECT climber_id, category_id, points_awarded,
          ROW_NUMBER() OVER (PARTITION BY climber_id, category_id ORDER BY points_awarded DESC) AS score_rank
        FROM FinalScores WHERE points_awarded > 0
      ),
      Top5Sums AS (
        SELECT climber_id, category_id, SUM(points_awarded) AS total_points
        FROM RankedScores WHERE score_rank <= 5 GROUP BY climber_id, category_id
      ),
      ClimberStats AS (
        SELECT c.name, cc.category_id, cat.category_name,
          COALESCE(t5s.total_points, 0) AS total_points,
          RANK() OVER (PARTITION BY cc.category_id ORDER BY COALESCE(t5s.total_points, 0) DESC) AS cat_rank
        FROM climbers c
        JOIN climber_categories cc ON c.climber_id = cc.climber_id
        JOIN categories cat ON cc.category_id = cat.category_id
        LEFT JOIN Top5Sums t5s
          ON c.climber_id = t5s.climber_id AND t5s.category_id = cc.category_id
        WHERE COALESCE(t5s.total_points, 0) > 0
      )
      SELECT category_id, category_name, name, total_points::int, cat_rank::int
      FROM ClimberStats
      WHERE cat_rank <= 3
      ORDER BY category_name, cat_rank
    `)

    const map = new Map<number, CategoryTop3>()
    for (const row of res.rows) {
      if (!map.has(row.category_id)) {
        map.set(row.category_id, { category_id: row.category_id, category_name: row.category_name, athletes: [] })
      }
      map.get(row.category_id)!.athletes.push({ name: row.name, total_points: row.total_points })
    }
    return [...map.values()]
  } catch {
    return []
  }
}

const PODIUM = ['🥇', '🥈', '🥉']

const cards = [
  { href: '/admin/athletes',    title: 'Athletes',    desc: 'Manage climbers and bulk import via CSV',   Icon: Users,       statKey: 'climberCount' as const, unit: 'athlete' },
  { href: '/admin/routes',      title: 'Routes',      desc: 'Set up qualifier routes and point values',  Icon: MapPin,      statKey: 'routeCount' as const,   unit: 'route' },
  { href: '/admin/judges',      title: 'Judges',      desc: 'Create judge accounts and assign routes',   Icon: ShieldCheck, statKey: 'judgeCount' as const,   unit: 'judge' },
  { href: '/admin/results',     title: 'Results',     desc: 'View and edit submitted scores',            Icon: BarChart2,   statKey: 'resultCount' as const,  unit: 'result' },
  { href: '/admin/leaderboard', title: 'Leaderboard', desc: 'Live qualifier rankings by category',       Icon: Trophy,      statKey: null,                    unit: '' },
  { href: '/admin/finals',      title: 'Finals',      desc: 'Manage finalists, routes, and scores',      Icon: Zap,         statKey: null,                    unit: '' },
]

export default async function AdminDashboard() {
  const [stats, top3] = await Promise.all([getStats(), getTop3PerCategory()])

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>
          Admin
        </p>
        <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
      </div>

      {/* ── Quick-nav cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ href, title, desc, Icon, statKey, unit }) => {
          const count = statKey ? stats[statKey] : null
          return (
            <Link key={href} href={href} className="block">
              <div className="admin-card">
                {/* Icon */}
                <div className="mb-4 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--field-orange-dim)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)' }}>
                  <Icon strokeWidth={1.75} style={{ color: 'var(--field-orange)', width: '18px', height: '18px' }} />
                </div>

                <h3 className="font-bold text-base mb-1" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--field-muted)' }}>
                  {desc}
                </p>

                {/* Live count chip */}
                {count !== null && (
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: count > 0 ? 'var(--field-green-dim)' : 'var(--field-raised)',
                      color: count > 0 ? 'var(--field-green-text)' : 'var(--field-muted)',
                    }}>
                    {count > 0
                      ? `${count} ${unit}${count !== 1 ? 's' : ''} configured`
                      : 'Not started'}
                  </div>
                )}

                <div className="arrow-hint mt-4 flex items-center gap-1 text-xs font-semibold"
                  style={{ color: 'var(--field-orange)' }}>
                  Open <span>→</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Top 3 per category ───────────────────────────────────────── */}
      {top3.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>Live Standings</p>
              <h2 className="font-bold text-xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>
                Top 3 by Category
              </h2>
            </div>
            <Link href="/admin/leaderboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--field-raised)', color: 'var(--field-muted)', boxShadow: 'var(--shadow-xs)' }}>
              Full leaderboard →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {top3.map(cat => (
              <div key={cat.category_id}
                className="p-4 rounded-2xl"
                style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3"
                  style={{ color: 'var(--field-muted)', letterSpacing: '0.08em' }}>
                  {cat.category_name}
                </p>
                <div className="space-y-2">
                  {cat.athletes.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0 w-5 text-center">{PODIUM[i]}</span>
                      <span className="text-sm font-medium truncate flex-1" style={{ color: 'var(--field-text)' }}>
                        {a.name}
                      </span>
                      <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: 'var(--field-orange)' }}>
                        {a.total_points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
