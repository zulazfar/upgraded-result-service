import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const result = await db.query('SELECT category_id, category_name FROM categories ORDER BY category_id')
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return Response.json({ message: 'Failed to fetch categories.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { category_name } = await req.json()
    if (!category_name?.trim()) return Response.json({ message: 'Category name required.' }, { status: 400 })

    const result = await db.query(
      'INSERT INTO categories (category_name) VALUES ($1) RETURNING *',
      [category_name.trim()]
    )
    return Response.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') return Response.json({ message: 'Category already exists.' }, { status: 409 })
    console.error('Error creating category:', error)
    return Response.json({ message: 'Failed to create category.' }, { status: 500 })
  }
}
