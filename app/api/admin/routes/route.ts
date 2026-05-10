import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const result = await db.query('SELECT route_id, route_name, difficulty_points FROM routes ORDER BY route_id')
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching routes:', error)
    return Response.json({ message: 'Failed to fetch routes.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { route_id, route_name, difficulty_points } = await req.json()
    if (!route_id || difficulty_points === undefined) {
      return Response.json({ message: 'route_id and difficulty_points required.' }, { status: 400 })
    }

    const result = await db.query(
      'INSERT INTO routes (route_id, route_name, difficulty_points) VALUES ($1, $2, $3) RETURNING *',
      [route_id, route_name || null, difficulty_points]
    )
    return Response.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') return Response.json({ message: 'Route ID already exists.' }, { status: 409 })
    console.error('Error adding route:', error)
    return Response.json({ message: 'Failed to add route.' }, { status: 500 })
  }
}
