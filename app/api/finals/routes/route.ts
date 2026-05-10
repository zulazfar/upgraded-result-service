import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const result = await db.query(`
      SELECT fr.route_id, fr.route_name,
        COALESCE(JSONB_AGG(rcl.category_id) FILTER (WHERE rcl.category_id IS NOT NULL), '[]') AS category_ids
      FROM finals_routes fr
      LEFT JOIN route_category_link rcl ON fr.route_id = rcl.route_id
      GROUP BY fr.route_id, fr.route_name ORDER BY fr.route_id
    `)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching finals routes:', error)
    return Response.json({ message: 'Failed to fetch finals routes.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { routes } = await req.json()
    if (!Array.isArray(routes) || routes.length === 0) {
      return Response.json({ message: 'Routes array required.' }, { status: 400 })
    }

    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query('TRUNCATE finals_routes RESTART IDENTITY CASCADE')

      for (let i = 0; i < routes.length; i++) {
        const route = routes[i]
        await client.query('INSERT INTO finals_routes (route_id, route_name) VALUES ($1, $2)', [i + 1, route.route_name.trim()])
        for (const catId of (route.category_ids || [])) {
          await client.query('INSERT INTO route_category_link (route_id, category_id) VALUES ($1, $2)', [i + 1, catId])
        }
      }
      await client.query('COMMIT')
      return Response.json({ message: `${routes.length} finals routes saved.` })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error saving finals routes:', error)
    return Response.json({ message: 'Failed to save finals routes.' }, { status: 500 })
  }
}
