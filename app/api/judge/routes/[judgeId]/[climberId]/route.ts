import { db } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ judgeId: string; climberId: string }> }) {
  try {
    const { judgeId, climberId } = await params

    const catResult = await db.query(
      'SELECT category_id FROM climber_categories WHERE LOWER(climber_id)=LOWER($1) LIMIT 1',
      [climberId]
    )
    if (catResult.rows.length === 0) {
      return Response.json({ message: 'Climber not assigned to any category.' }, { status: 404 })
    }
    const categoryId = catResult.rows[0].category_id

    const routesResult = await db.query(
      `SELECT r.route_id, r.route_name, r.difficulty_points
       FROM routes r
       JOIN judge_route_assignments jr ON r.route_id = jr.route_id
       WHERE jr.judge_id=$1 ORDER BY r.route_id`,
      [parseInt(judgeId)]
    )

    const routes = await Promise.all(routesResult.rows.map(async (route) => {
      const scoreResult = await db.query(
        `SELECT score_type, attempts, points_awarded FROM results
         WHERE LOWER(climber_id)=LOWER($1) AND route_id=$2 AND category_id=$3
         ORDER BY timestamp DESC LIMIT 1`,
        [climberId, route.route_id, categoryId]
      )
      const score = scoreResult.rows[0]
      return {
        route_id: route.route_id.toString(),
        route_name: route.route_name,
        difficulty_points: route.difficulty_points,
        status: score ? (score.score_type === 'top' ? 'completed' : 'in_progress') : 'pending',
        attempts: score?.attempts || 0,
        points_awarded: score?.points_awarded || 0,
        category_id: categoryId,
      }
    }))

    return Response.json(routes)
  } catch (error: any) {
    console.error('Error fetching judge routes:', error)
    return Response.json({ message: error.message || 'Failed to fetch routes.' }, { status: 500 })
  }
}
