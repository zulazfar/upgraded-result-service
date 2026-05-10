import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

async function recalculatePoints(climberId: string, routeId: number, categoryId: number, isTop: boolean): Promise<number> {
  if (!isTop) return 0
  const routeResult = await db.query('SELECT difficulty_points FROM routes WHERE route_id=$1', [routeId])
  const route = routeResult.rows[0]
  if (!route) throw new Error(`Route ${routeId} not found.`)

  const climberResult = await db.query(
    `SELECT c.gender, cat.category_name FROM climbers c
     JOIN climber_categories cc ON c.climber_id = cc.climber_id
     JOIN categories cat ON cc.category_id = cat.category_id
     WHERE c.climber_id=$1 AND cat.category_id=$2`,
    [climberId, categoryId]
  )
  const details = climberResult.rows[0]
  if (!details) return route.difficulty_points

  const isFemale = details.gender === 'Female'
  const name = details.category_name.toLowerCase()
  const isPairOrTeam = name.includes('pair') || name.includes('team') || name.includes('double')
  return (isFemale && isPairOrTeam) ? route.difficulty_points * 2 : route.difficulty_points
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn) return Response.json({ message: 'Unauthorized.' }, { status: 401 })

    const { climber_id, route_id, score_type, category_id } = await req.json()
    if (!climber_id || !route_id || !score_type || !category_id) {
      return Response.json({ message: 'All fields required.' }, { status: 400 })
    }

    const routeIdInt = parseInt(route_id)
    const categoryIdInt = parseInt(category_id)
    const isTop = score_type === 'top'

    const client = await db.connect()
    try {
      await client.query('BEGIN')

      // Get correctly-cased climber ID
      const idResult = await client.query('SELECT climber_id FROM climbers WHERE LOWER(climber_id)=LOWER($1)', [climber_id])
      if (idResult.rows.length === 0) throw new Error(`Climber ${climber_id} not found.`)
      const finalClimberId = idResult.rows[0].climber_id

      // Check existing score
      const existing = await client.query(
        'SELECT score_type, attempts FROM results WHERE climber_id=$1 AND route_id=$2 AND category_id=$3 ORDER BY timestamp DESC LIMIT 1',
        [finalClimberId, routeIdInt, categoryIdInt]
      )

      if (existing.rows.length > 0 && existing.rows[0].score_type === 'top') {
        await client.query('ROLLBACK')
        return Response.json({ message: 'Already topped. Cannot resubmit.' }, { status: 400 })
      }

      const currentAttempts = existing.rows[0]?.attempts || 0
      const newAttempts = currentAttempts + 1
      const points = await recalculatePoints(finalClimberId, routeIdInt, categoryIdInt, isTop)

      let result
      if (existing.rows.length === 0) {
        result = await client.query(
          `INSERT INTO results (climber_id, route_id, score_type, attempts, points_awarded, is_top, category_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING attempts, points_awarded`,
          [finalClimberId, routeIdInt, score_type, newAttempts, points, isTop, categoryIdInt]
        )
      } else {
        result = await client.query(
          `UPDATE results SET score_type=$1, attempts=$2, points_awarded=$3, is_top=$4, timestamp=NOW()
           WHERE climber_id=$5 AND route_id=$6 AND category_id=$7 RETURNING attempts, points_awarded`,
          [score_type, newAttempts, points, isTop, finalClimberId, routeIdInt, categoryIdInt]
        )
      }

      await client.query('COMMIT')
      return Response.json({ message: 'Score recorded.', result: result.rows[0], is_completed: isTop }, { status: 201 })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('Error recording score:', error)
    return Response.json({ message: error.message || 'Failed to record score.' }, { status: 500 })
  }
}
