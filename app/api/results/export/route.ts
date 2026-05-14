import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const categoryId = searchParams.get('category_id')
    const format = searchParams.get('format') || 'csv'

    // Support filtering by one or more category IDs:
    //   ?category_id=3          (legacy, single)
    //   ?category_ids=1,2,3     (new, multi-select from export modal)
    const categoryIdsParam = searchParams.get('category_ids')
    const categoryIds: number[] = categoryIdsParam
      ? categoryIdsParam.split(',').map(Number).filter(Boolean)
      : categoryId
        ? [parseInt(categoryId, 10)]
        : []

    let query = `
      SELECT c.climber_id, c.name AS climber_name, c.gender, c.team_name,
        cat.category_name, r.route_id, r.attempts, r.is_top,
        r.points_awarded, r.score_type,
        to_char(r.timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS timestamp
      FROM results r
      JOIN climbers c ON r.climber_id = c.climber_id
      JOIN categories cat ON r.category_id = cat.category_id
    `
    const queryParams: unknown[] = []
    if (categoryIds.length > 0) {
      query += ' WHERE r.category_id = ANY($1::int[])'
      queryParams.push(categoryIds)
    }
    query += ' ORDER BY cat.category_name, c.name, r.route_id'

    const result = await db.query(query, queryParams)
    const rows = result.rows

    // Date for filename fallback (client overrides via <a download="…">)
    const dateStr = new Date().toISOString().split('T')[0]

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Results')
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      return new Response(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${dateStr}-results.xlsx"`,
        },
      })
    }

    // CSV — quote fields that contain commas, quotes, or newlines
    if (rows.length === 0) {
      return new Response('', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${dateStr}-results.csv"`,
        },
      })
    }
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const v = row[h] ?? ''
          const s = String(v)
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"` : s
        }).join(',')
      )
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${dateStr}-results.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return Response.json({ message: 'Export failed.' }, { status: 500 })
  }
}
