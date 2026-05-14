import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcrypt'

export async function GET() {
  try {
    const result = await db.query(`
      SELECT j.judge_id, j.name, j.username, j.is_superadmin,
        COUNT(jra.route_id)::int AS route_count
      FROM judges j
      LEFT JOIN judge_route_assignments jra ON j.judge_id = jra.judge_id
      GROUP BY j.judge_id, j.name, j.username, j.is_superadmin
      ORDER BY j.name
    `)
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

    const { name, username, password, is_superadmin, admin_password } = await req.json()
    if (!name?.trim() || !username?.trim() || !password) {
      return Response.json({ message: 'Name, username, and password required.' }, { status: 400 })
    }

    // Granting superadmin requires the current admin to confirm their own password
    if (is_superadmin) {
      if (!admin_password) {
        return Response.json({ message: 'Your password is required to grant admin access.' }, { status: 400 })
      }
      const adminRow = await db.query('SELECT password_hash FROM judges WHERE judge_id=$1', [session.judgeId])
      if (adminRow.rows.length === 0) return Response.json({ message: 'Session error.' }, { status: 401 })
      const valid = await bcrypt.compare(admin_password, adminRow.rows[0].password_hash)
      if (!valid) return Response.json({ message: 'Incorrect password.' }, { status: 401 })
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
