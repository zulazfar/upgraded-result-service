import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const result = await db.query('DELETE FROM finals_climbers WHERE climber_id=$1 RETURNING climber_id', [id])
    if (result.rowCount === 0) return Response.json({ message: 'Climber not found.' }, { status: 404 })
    return Response.json({ message: 'Climber removed from finals.' })
  } catch (error) {
    console.error('Error removing finals climber:', error)
    return Response.json({ message: 'Failed to remove climber.' }, { status: 500 })
  }
}
