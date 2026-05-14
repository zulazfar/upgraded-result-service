import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const result = await db.query(`
      SELECT r.route_id, r.route_name, r.difficulty_points,
        COUNT(DISTINCT res.result_id)::int AS result_count,
        (
          SELECT COALESCE(STRING_AGG(j2.name, ', '), '')
          FROM judge_route_assignments jra2
          JOIN judges j2 ON jra2.judge_id = j2.judge_id
          WHERE jra2.route_id = r.route_id AND j2.is_superadmin = false
        ) AS assigned_judges
      FROM routes r
      LEFT JOIN results res ON r.route_id = res.route_id
      GROUP BY r.route_id, r.route_name, r.difficulty_points
      ORDER BY r.route_id
    `)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching routes:', error)
    return Response.json({ message: 'Failed to fetch routes.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { route_id, route_name, difficulty_points } = await req.json()
    if (!route_id || difficulty_points === undefined) {
      return Response.json({ message: 'route_id and difficulty_points required.' }, { status: 400 })
    }

    const result = await db.query(
      'INSERT INTO routes (route_id, route_name, difficulty_points) VALUES ($1, $2, $3) RETURNING *',
      [route_id, route_name || null, difficulty_points]
    )
    return Response.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') return Response.json({ message: 'Route ID already exists.' }, { status: 409 })
    console.error('Error adding route:', error)
    return Response.json({ message: 'Failed to add route.' }, { status: 500 })
  }
}
