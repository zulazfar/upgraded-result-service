import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcrypt'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const { name, username, password, is_superadmin, admin_password } = await req.json()
    const judgeId = parseInt(id)

    // If promoting a non-admin judge to admin, require password verification
    if (is_superadmin) {
      const existing = await db.query('SELECT is_superadmin FROM judges WHERE judge_id=$1', [judgeId])
      if (existing.rows.length === 0) return Response.json({ message: 'Judge not found.' }, { status: 404 })
      if (!existing.rows[0].is_superadmin) {
        if (!admin_password) {
          return Response.json({ message: 'Your password is required to grant admin access.' }, { status: 400 })
        }
        const adminRow = await db.query('SELECT password_hash FROM judges WHERE judge_id=$1', [session.judgeId])
        if (adminRow.rows.length === 0) return Response.json({ message: 'Session error.' }, { status: 401 })
        const valid = await bcrypt.compare(admin_password, adminRow.rows[0].password_hash)
        if (!valid) return Response.json({ message: 'Incorrect password.' }, { status: 401 })
      }
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10)
      await db.query(
        'UPDATE judges SET name=$1, username=$2, password_hash=$3, is_superadmin=$4 WHERE judge_id=$5',
        [name, username, hash, is_superadmin, judgeId]
      )
    } else {
      await db.query(
        'UPDATE judges SET name=$1, username=$2, is_superadmin=$3 WHERE judge_id=$4',
        [name, username, is_superadmin, judgeId]
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
    const result = await db.query('DELETE FROM judges WHERE judge_id=$1 RETURNING judge_id', [parseInt(id, 10)])
    if (result.rowCount === 0) return Response.json({ message: 'Judge not found.' }, { status: 404 })
    return Response.json({ message: 'Judge deleted.' })
  } catch (error) {
    console.error('Error deleting judge:', error)
    return Response.json({ message: 'Failed to delete judge.' }, { status: 500 })
  }
}
