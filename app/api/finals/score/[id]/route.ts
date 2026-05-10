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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const { is_top, is_zone, attempts_to_top, attempts_to_zone } = await req.json()

    const existing = await db.query(
      'SELECT fr.climber_id FROM finals_results fr WHERE fr.result_id=$1',
      [parseInt(id)]
    )
    if (existing.rows.length === 0) return Response.json({ message: 'Result not found.' }, { status: 404 })

    const { climber_id } = existing.rows[0]
    const climberResult = await db.query(
      'SELECT category, gender FROM finals_climbers WHERE climber_id=$1',
      [climber_id]
    )
    const { category, gender } = climberResult.rows[0]
    const multiplier = (category?.toLowerCase() === 'team' && gender === 'Female') ? 2 : 1
    const score = calcFinalsScore(is_top, is_zone, attempts_to_top || 0, attempts_to_zone || 0, multiplier)

    await db.query(
      `UPDATE finals_results SET has_top=$1, has_zone=$2, attempts_to_top=$3, attempts_to_zone=$4, score=$5
       WHERE result_id=$6`,
      [is_top, is_zone, attempts_to_top || 0, attempts_to_zone || 0, score, parseInt(id)]
    )
    return Response.json({ message: 'Score updated.', score })
  } catch (error) {
    console.error('Error editing finals score:', error)
    return Response.json({ message: 'Failed to edit score.' }, { status: 500 })
  }
}
