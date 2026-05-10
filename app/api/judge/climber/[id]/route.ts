import { db } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await db.query(
      `SELECT c.climber_id, c.name, c.gender, c.age, c.team_name,
        cat.category_name, cat.category_id
       FROM climbers c
       LEFT JOIN climber_categories cc ON c.climber_id = cc.climber_id
       LEFT JOIN categories cat ON cc.category_id = cat.category_id
       WHERE LOWER(c.climber_id)=LOWER($1)`,
      [id]
    )
    if (result.rows.length === 0) return Response.json({ message: 'Climber not found.' }, { status: 404 })
    return Response.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching climber:', error)
    return Response.json({ message: 'Failed to fetch climber.' }, { status: 500 })
  }
}
