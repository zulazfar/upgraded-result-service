import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

function calcFinalsScore(isTop: boolean, isZone: boolean, attTop: number, attZone: number, multiplier: number): number {
  const topPoints = 25 * multiplier
  const zonePoints = 10 * multiplier
  let score = 0
  if (isTop) score = topPoints - (attTop - 1) * 0.1
  else if (isZone) score = zonePoints - (attZone - 1) * 0.1
  return Math.round(Math.max(0, score) * 10) / 10
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn) return Response.json({ message: 'Unauthorized.' }, { status: 401 })

    const { climber_id, route_id, is_top, is_zone, attempts_to_top, attempts_to_zone } = await req.json()

    const climberResult = await db.query(
      'SELECT category, gender FROM finals_climbers WHERE climber_id=$1',
      [climber_id]
    )
    if (climberResult.rows.length === 0) return Response.json({ message: 'Climber not found in finals.' }, { status: 404 })

    const { category, gender } = climberResult.rows[0]
    const isTeam = category?.toLowerCase() === 'team'
    const multiplier = (isTeam && gender === 'Female') ? 2 : 1

    const score = calcFinalsScore(is_top, is_zone, attempts_to_top || 0, attempts_to_zone || 0, multiplier)

    const duplicate = await db.query(
      'SELECT result_id FROM finals_results WHERE climber_id=$1 AND route_id=$2',
      [climber_id, route_id]
    )
    if (duplicate.rows.length > 0) {
      return Response.json({ message: 'Score already submitted for this climber and route.' }, { status: 400 })
    }

    const result = await db.query(
      `INSERT INTO finals_results (climber_id, route_id, has_top, has_zone, attempts_to_top, attempts_to_zone, score)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING result_id`,
      [climber_id, route_id, is_top, is_zone, attempts_to_top || 0, attempts_to_zone || 0, score]
    )

    return Response.json({ message: 'Score recorded.', score, result_id: result.rows[0].result_id }, { status: 201 })
  } catch (error) {
    console.error('Error recording finals score:', error)
    return Response.json({ message: 'Failed to record score.' }, { status: 500 })
  }
}
