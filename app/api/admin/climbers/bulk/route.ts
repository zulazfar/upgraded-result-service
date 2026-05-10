import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { parse } from 'csv-parse/sync'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const categoryId = formData.get('category_id')

    if (!file) return Response.json({ message: 'No file provided.' }, { status: 400 })

    const text = await file.text()
    const records = parse(text, { columns: true, skip_empty_lines: true, trim: true })

    if (records.length === 0) return Response.json({ message: 'CSV is empty.' }, { status: 400 })

    const client = await db.connect()
    let inserted = 0, skipped = 0

    try {
      await client.query('BEGIN')
      for (const _row of records) {
        const row = _row as Record<string, string>
        const id = (row['Climber ID'] || row['climber_id'] || row['id'] || '').trim()
        const name = (row['Name'] || row['name'] || '').trim()
        const gender = (row['Gender'] || row['gender'] || '').trim() || null
        const age = parseInt(row['Age'] || row['age']) || null
        const team = (row['Team'] || row['team_name'] || row['Organisation'] || '').trim() || null

        if (!id || !name) { skipped++; continue }

        await client.query(
          `INSERT INTO climbers (climber_id, name, gender, age, team_name)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (climber_id) DO UPDATE SET name=$2, gender=$3, age=$4, team_name=$5`,
          [id, name, gender, age, team]
        )

        if (categoryId) {
          await client.query(
            'INSERT INTO climber_categories (climber_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, parseInt(categoryId as string)]
          )
        }
        inserted++
      }
      await client.query('COMMIT')
      return Response.json({ message: `Imported ${inserted} climbers, skipped ${skipped}.`, inserted, skipped })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Bulk import error:', error)
    return Response.json({ message: 'Bulk import failed.' }, { status: 500 })
  }
}
