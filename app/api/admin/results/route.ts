import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const result = await db.query(`
      SELECT r.result_id, r.climber_id, c.name AS climber_name,
        r.route_id, r.category_id, cat.category_name,
        r.attempts, r.is_top, r.points_awarded, r.score_type, r.timestamp
      FROM results r
      JOIN climbers c ON r.climber_id = c.climber_id
      JOIN categories cat ON r.category_id = cat.category_id
      ORDER BY r.timestamp DESC
    `)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching results:', error)
    return Response.json({ message: 'Failed to fetch results.' }, { status: 500 })
  }
}
