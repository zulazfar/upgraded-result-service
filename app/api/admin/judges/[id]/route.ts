import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcrypt'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const { name, username, password, is_superadmin } = await req.json()

    if (password) {
      const hash = await bcrypt.hash(password, 10)
      await db.query(
        'UPDATE judges SET name=$1, username=$2, password_hash=$3, is_superadmin=$4 WHERE judge_id=$5',
        [name, username, hash, is_superadmin, parseInt(id)]
      )
    } else {
      await db.query(
        'UPDATE judges SET name=$1, username=$2, is_superadmin=$3 WHERE judge_id=$4',
        [name, username, is_superadmin, parseInt(id)]
      )
    }
    return Response.json({ message: 'Judge updated.' })
  } catch (error) {
    console.error('Error updating judge:', error)
    return Response.json({ message: 'Failed to update judge.' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const result = await db.query('DELETE FROM judges WHERE judge_id=$1 RETURNING judge_id', [parseInt(id)])
    if (result.rowCount === 0) return Response.json({ message: 'Judge not found.' }, { status: 404 })
    return Response.json({ message: 'Judge deleted.' })
  } catch (error) {
    console.error('Error deleting judge:', error)
    return Response.json({ message: 'Failed to delete judge.' }, { status: 500 })
  }
}
