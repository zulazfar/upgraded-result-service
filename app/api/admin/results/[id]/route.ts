import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

async function recalculatePoints(climberId: string, routeId: number, categoryId: number, isTop: boolean): Promise<number> {
  if (!isTop) return 0

  const routeResult = await db.query('SELECT difficulty_points FROM routes WHERE route_id=$1', [routeId])
  const route = routeResult.rows[0]
  if (!route) throw new Error(`Route ${routeId} not found.`)

  const climberResult = await db.query(
    `SELECT c.gender, cat.category_name
     FROM climbers c
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const { score_type, attempts, category_id } = await req.json()
    const isTop = score_type === 'top'

    const existing = await db.query('SELECT climber_id, route_id, category_id FROM results WHERE result_id=$1', [parseInt(id)])
    if (existing.rows.length === 0) return Response.json({ message: 'Result not found.' }, { status: 404 })

    const { climber_id, route_id } = existing.rows[0]
    const catId = category_id || existing.rows[0].category_id
    const points = await recalculatePoints(climber_id, route_id, catId, isTop)

    await db.query(
      'UPDATE results SET score_type=$1, attempts=$2, is_top=$3, points_awarded=$4, timestamp=NOW() WHERE result_id=$5',
      [score_type, attempts, isTop, points, parseInt(id)]
    )
    return Response.json({ message: 'Result updated.', points_awarded: points })
  } catch (error) {
    console.error('Error updating result:', error)
    return Response.json({ message: 'Failed to update result.' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const result = await db.query('DELETE FROM results WHERE result_id=$1 RETURNING result_id', [parseInt(id)])
    if (result.rowCount === 0) return Response.json({ message: 'Result not found.' }, { status: 404 })
    return Response.json({ message: 'Result deleted.' })
  } catch (error) {
    console.error('Error deleting result:', error)
    return Response.json({ message: 'Failed to delete result.' }, { status: 500 })
  }
}
