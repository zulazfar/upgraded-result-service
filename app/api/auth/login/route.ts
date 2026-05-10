import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return Response.json({ message: 'Username and password required.' }, { status: 400 })
    }

    const result = await db.query(
      'SELECT judge_id, name, password_hash, is_superadmin FROM judges WHERE username = $1',
      [username]
    )

    if (result.rows.length === 0) {
      return Response.json({ message: 'Invalid credentials.' }, { status: 401 })
    }

    const judge = result.rows[0]
    const isMatch = await bcrypt.compare(password, judge.password_hash)

    if (!isMatch) {
      return Response.json({ message: 'Invalid credentials.' }, { status: 401 })
    }

    const session = await getSession()
    session.judgeId = judge.judge_id
    session.judgeName = judge.name
    session.isSuperAdmin = judge.is_superadmin
    session.isLoggedIn = true
    await session.save()

    return Response.json({
      judgeId: judge.judge_id,
      judgeName: judge.name,
      isSuperAdmin: judge.is_superadmin,
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ message: 'Login failed.' }, { status: 500 })
  }
}
