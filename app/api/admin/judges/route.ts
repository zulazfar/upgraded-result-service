import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcrypt'

export async function GET() {
  try {
    const result = await db.query(
      'SELECT judge_id, name, username, is_superadmin FROM judges ORDER BY judge_id'
    )
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching judges:', error)
    return Response.json({ message: 'Failed to fetch judges.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { name, username, password, is_superadmin } = await req.json()
    if (!name?.trim() || !username?.trim() || !password) {
      return Response.json({ message: 'Name, username, and password required.' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)
    const result = await db.query(
      'INSERT INTO judges (name, username, password_hash, is_superadmin) VALUES ($1, $2, $3, $4) RETURNING judge_id, name, username, is_superadmin',
      [name.trim(), username.trim(), hash, is_superadmin || false]
    )
    return Response.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') return Response.json({ message: 'Username already exists.' }, { status: 409 })
    console.error('Error adding judge:', error)
    return Response.json({ message: 'Failed to add judge.' }, { status: 500 })
  }
}
