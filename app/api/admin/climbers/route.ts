import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const result = await db.query(`
      SELECT c.climber_id, c.name, c.gender, c.age, c.team_name,
        COALESCE(JSON_AGG(JSON_BUILD_OBJECT('category_id', cat.category_id, 'category_name', cat.category_name))
          FILTER (WHERE cat.category_id IS NOT NULL), '[]') AS categories
      FROM climbers c
      LEFT JOIN climber_categories cc ON c.climber_id = cc.climber_id
      LEFT JOIN categories cat ON cc.category_id = cat.category_id
      GROUP BY c.climber_id ORDER BY c.name
    `)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching climbers:', error)
    return Response.json({ message: 'Failed to fetch climbers.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { climber_id, name, gender, age, team_name, category_ids } = await req.json()
    if (!climber_id?.trim() || !name?.trim()) {
      return Response.json({ message: 'Climber ID and name required.' }, { status: 400 })
    }

    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        'INSERT INTO climbers (climber_id, name, gender, age, team_name) VALUES ($1, $2, $3, $4, $5)',
        [climber_id.trim(), name.trim(), gender || null, age || null, team_name?.trim() || null]
      )
      if (Array.isArray(category_ids)) {
        for (const catId of category_ids) {
          await client.query(
            'INSERT INTO climber_categories (climber_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [climber_id.trim(), catId]
          )
        }
      }
      await client.query('COMMIT')
      return Response.json({ message: 'Climber added.', climber_id }, { status: 201 })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error: any) {
    if (error.code === '23505') return Response.json({ message: 'Climber ID already exists.' }, { status: 409 })
    console.error('Error adding climber:', error)
    return Response.json({ message: 'Failed to add climber.' }, { status: 500 })
  }
}
