import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const { route_name, difficulty_points } = await req.json()

    await db.query(
      'UPDATE routes SET route_name=$1, difficulty_points=$2 WHERE route_id=$3',
      [route_name || null, difficulty_points, parseInt(id)]
    )
    return Response.json({ message: 'Route updated.' })
  } catch (error) {
    console.error('Error updating route:', error)
    return Response.json({ message: 'Failed to update route.' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const result = await db.query('DELETE FROM routes WHERE route_id=$1 RETURNING route_id', [parseInt(id)])
    if (result.rowCount === 0) return Response.json({ message: 'Route not found.' }, { status: 404 })
    return Response.json({ message: 'Route deleted.' })
  } catch (error) {
    console.error('Error deleting route:', error)
    return Response.json({ message: 'Failed to delete route.' }, { status: 500 })
  }
}
