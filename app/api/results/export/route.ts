import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('category_id')
    const format = searchParams.get('format') || 'csv'

    let query = `
      SELECT c.climber_id, c.name, c.gender, c.team_name, cat.category_name,
        r.route_id, r.attempts, r.is_top, r.points_awarded, r.score_type, r.timestamp
      FROM results r
      JOIN climbers c ON r.climber_id = c.climber_id
      JOIN categories cat ON r.category_id = cat.category_id
    `
    const queryParams: unknown[] = []
    if (categoryId) {
      query += ' WHERE r.category_id = $1'
      queryParams.push(parseInt(categoryId))
    }
    query += ' ORDER BY c.name, r.route_id'

    const result = await db.query(query, queryParams)
    const rows = result.rows

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Results')
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return new Response(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="results.xlsx"',
        },
      })
    }

    // CSV
    const headers = Object.keys(rows[0] || {})
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="results.csv"',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return Response.json({ message: 'Export failed.' }, { status: 500 })
  }
}
