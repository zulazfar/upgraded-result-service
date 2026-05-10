import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { parse } from 'csv-parse/sync'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ message: 'No file provided.' }, { status: 400 })

    const text = await file.text()
    const records = parse(text, { columns: true, skip_empty_lines: true, trim: true })

    const client = await db.connect()
    let inserted = 0, skipped = 0

    try {
      await client.query('BEGIN')
      for (const _row of records) {
        const row = _row as Record<string, string>
        const routeId = parseInt(row['Route ID'] || row['route_id'] || row['id'] || '')
        const routeName = (row['Route Name'] || row['route_name'] || row['name'] || '').trim() || null
        const points = parseInt(row['Points'] || row['difficulty_points'] || '0') || 0

        if (isNaN(routeId)) { skipped++; continue }

        await client.query(
          `INSERT INTO routes (route_id, route_name, difficulty_points)
           VALUES ($1, $2, $3)
           ON CONFLICT (route_id) DO UPDATE SET route_name=$2, difficulty_points=$3`,
          [routeId, routeName, points]
        )
        inserted++
      }
      await client.query('COMMIT')
      return Response.json({ message: `Imported ${inserted} routes, skipped ${skipped}.`, inserted, skipped })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Bulk routes import error:', error)
    return Response.json({ message: 'Bulk import failed.' }, { status: 500 })
  }
}
