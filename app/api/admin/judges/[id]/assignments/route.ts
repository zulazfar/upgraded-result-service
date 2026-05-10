import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await db.query(
      `SELECT r.route_id, r.route_name, r.difficulty_points,
        EXISTS(SELECT 1 FROM judge_route_assignments WHERE judge_id=$1 AND route_id=r.route_id) AS assigned
       FROM routes r ORDER BY r.route_id`,
      [parseInt(id)]
    )
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return Response.json({ message: 'Failed to fetch assignments.' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const { route_ids } = await req.json()
    const judgeId = parseInt(id)

    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM judge_route_assignments WHERE judge_id=$1', [judgeId])
      for (const routeId of (route_ids || [])) {
        await client.query(
          'INSERT INTO judge_route_assignments (judge_id, route_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [judgeId, routeId]
        )
      }
      await client.query('COMMIT')
      return Response.json({ message: 'Assignments updated.' })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error updating assignments:', error)
    return Response.json({ message: 'Failed to update assignments.' }, { status: 500 })
  }
}
