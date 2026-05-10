import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(_req: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { categoryId } = await params
    const categoryIdInt = parseInt(categoryId)
    if (isNaN(categoryIdInt)) return Response.json({ message: 'Invalid category ID.' }, { status: 400 })

    const catResult = await db.query('SELECT category_name FROM categories WHERE category_id=$1', [categoryIdInt])
    if (catResult.rows.length === 0) return Response.json({ message: 'Category not found.' }, { status: 404 })
    const categoryName = catResult.rows[0].category_name

    const rankingQuery = `
      WITH LatestScores AS (
        SELECT r.climber_id, r.route_id, r.attempts, r.is_top, r.points_awarded,
          ROW_NUMBER() OVER (PARTITION BY r.climber_id, r.route_id ORDER BY r.timestamp DESC) as rn
        FROM results r WHERE r.category_id = ${categoryIdInt}
      ),
      FinalScores AS (SELECT * FROM LatestScores WHERE rn = 1),
      RankedScores AS (
        SELECT climber_id, points_awarded,
          ROW_NUMBER() OVER (PARTITION BY climber_id ORDER BY points_awarded DESC) as score_rank
        FROM FinalScores WHERE points_awarded > 0
      ),
      Top5Sums AS (
        SELECT climber_id, SUM(points_awarded) as top_5_points
        FROM RankedScores WHERE score_rank <= 5 GROUP BY climber_id
      ),
      ClimberStats AS (
        SELECT c.climber_id, c.name, c.team_name, c.gender,
          COALESCE(t5s.top_5_points, 0) AS total_points,
          COALESCE(SUM(CASE WHEN fs.is_top THEN 1 ELSE 0 END), 0) AS total_tops,
          COALESCE(SUM(fs.attempts) FILTER (WHERE fs.is_top), 0) AS total_attempts
        FROM climbers c
        JOIN climber_categories cc ON c.climber_id = cc.climber_id
        LEFT JOIN FinalScores fs ON c.climber_id = fs.climber_id
        LEFT JOIN Top5Sums t5s ON c.climber_id = t5s.climber_id
        WHERE cc.category_id = ${categoryIdInt}
        GROUP BY c.climber_id, c.name, c.team_name, c.gender, t5s.top_5_points
      ),
      ClimberRankings AS (
        SELECT *, RANK() OVER (ORDER BY total_points DESC, total_attempts ASC) as qual_rank
        FROM ClimberStats
      )
      SELECT * FROM ClimberRankings WHERE qual_rank <= 8`

    const finalists = await db.query(rankingQuery)
    if (finalists.rows.length === 0) {
      return Response.json({ message: 'No climbers found to promote.' }, { status: 400 })
    }

    const client = await db.connect()
    try {
      await client.query('BEGIN')
      for (const climber of finalists.rows) {
        await client.query(
          `INSERT INTO finals_climbers (climber_id, name, organisation, category, gender, category_id, qualifying_rank)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (climber_id) DO UPDATE SET qualifying_rank = EXCLUDED.qualifying_rank`,
          [climber.climber_id, climber.name, climber.team_name || null, categoryName, climber.gender, categoryIdInt, climber.qual_rank]
        )
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    const extra = finalists.rows.length > 8 ? ` (includes ${finalists.rows.length - 8} tied for 8th)` : ''
    return Response.json({ message: `Promoted ${finalists.rows.length} climbers from ${categoryName}${extra}.` })
  } catch (error) {
    console.error('Error promoting finalists:', error)
    return Response.json({ message: 'Failed to promote finalists.' }, { status: 500 })
  }
}
