import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const { name, gender, age, team_name, category_ids } = await req.json()

    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        'UPDATE climbers SET name=$1, gender=$2, age=$3, team_name=$4 WHERE LOWER(climber_id)=LOWER($5)',
        [name, gender || null, age || null, team_name || null, id]
      )
      await client.query(
        'DELETE FROM climber_categories WHERE LOWER(climber_id)=LOWER($1)',
        [id]
      )
      if (Array.isArray(category_ids)) {
        const realId = await client.query('SELECT climber_id FROM climbers WHERE LOWER(climber_id)=LOWER($1)', [id])
        const cid = realId.rows[0]?.climber_id
        for (const catId of category_ids) {
          await client.query(
            'INSERT INTO climber_categories (climber_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [cid, catId]
          )
        }
      }
      await client.query('COMMIT')
      return Response.json({ message: 'Climber updated.' })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error updating climber:', error)
    return Response.json({ message: 'Failed to update climber.' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { id } = await params
    const result = await db.query('DELETE FROM climbers WHERE LOWER(climber_id)=LOWER($1) RETURNING climber_id', [id])
    if (result.rowCount === 0) return Response.json({ message: 'Climber not found.' }, { status: 404 })
    return Response.json({ message: 'Climber deleted.' })
  } catch (error) {
    console.error('Error deleting climber:', error)
    return Response.json({ message: 'Failed to delete climber.' }, { status: 500 })
  }
}
