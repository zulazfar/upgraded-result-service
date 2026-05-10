import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const result = await db.query(
      'SELECT climber_id, name, organisation, category, gender, category_id, qualifying_rank FROM finals_climbers ORDER BY climber_id'
    )
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching finals climbers:', error)
    return Response.json({ message: 'Failed to fetch finals climbers.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { climber_id, name, organisation, category, gender, category_id } = await req.json()
    if (!climber_id || !name || !category || !gender || !category_id) {
      return Response.json({ message: 'All required fields missing.' }, { status: 400 })
    }

    const result = await db.query(
      `INSERT INTO finals_climbers (climber_id, name, organisation, category, gender, category_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [climber_id, name, organisation || null, category, gender, category_id]
    )
    return Response.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') return Response.json({ message: 'Climber already in finals.' }, { status: 409 })
    console.error('Error adding finals climber:', error)
    return Response.json({ message: 'Failed to add finals climber.' }, { status: 500 })
  }
}
