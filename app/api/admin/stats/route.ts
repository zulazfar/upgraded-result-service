import { db } from '@/lib/db'

export async function GET() {
  try {
    const [climbers, routes, judges, results] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM climbers'),
      db.query('SELECT COUNT(*)::int AS count FROM routes'),
      db.query('SELECT COUNT(*)::int AS count FROM judges WHERE is_superadmin = false'),
      db.query('SELECT COUNT(*)::int AS count FROM results'),
    ])
    return Response.json({
      climberCount: climbers.rows[0].count,
      routeCount:   routes.rows[0].count,
      judgeCount:   judges.rows[0].count,
      resultCount:  results.rows[0].count,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return Response.json({ climberCount: 0, routeCount: 0, judgeCount: 0, resultCount: 0 })
  }
}
