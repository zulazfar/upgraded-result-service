import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const wb = XLSX.utils.book_new()

    // ── Sheet 1: Climbers ─────────────────────────────────────────────────────
    const climbers = await db.query(`
      SELECT c.climber_id, c.name, c.gender, c.age, c.team_name,
        STRING_AGG(cat.category_name, ', ' ORDER BY cat.category_name) AS categories
      FROM climbers c
      LEFT JOIN climber_categories cc ON c.climber_id = cc.climber_id
      LEFT JOIN categories cat ON cc.category_id = cat.category_id
      GROUP BY c.climber_id, c.name, c.gender, c.age, c.team_name
      ORDER BY c.name
    `)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(climbers.rows), 'Climbers')

    // ── Sheet 2: All Results ──────────────────────────────────────────────────
    const results = await db.query(`
      SELECT
        c.climber_id, c.name AS climber_name, c.gender, c.team_name,
        cat.category_name, r.route_id, r.score_type, r.attempts,
        r.is_top, r.points_awarded,
        TO_CHAR(r.timestamp, 'YYYY-MM-DD HH24:MI:SS') AS submitted_at
      FROM results r
      JOIN climbers c ON r.climber_id = c.climber_id
      JOIN categories cat ON r.category_id = cat.category_id
      ORDER BY cat.category_name, c.name, r.route_id
    `)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results.rows), 'All Results')

    // ── Sheet 3+: Leaderboard per category ────────────────────────────────────
    const categories = await db.query('SELECT category_id, category_name FROM categories ORDER BY category_name')

    for (const cat of categories.rows) {
      const lb = await db.query(`
        WITH scored AS (
          SELECT
            c.climber_id, c.name AS climber_name, c.team_name,
            SUM(r.points_awarded) AS total_points,
            COUNT(*) FILTER (WHERE r.is_top) AS total_tops,
            SUM(r.attempts) AS total_attempts
          FROM results r
          JOIN climbers c ON r.climber_id = c.climber_id
          WHERE r.category_id = $1
          GROUP BY c.climber_id, c.name, c.team_name
        )
        SELECT
          RANK() OVER (ORDER BY total_points DESC, total_tops DESC, total_attempts ASC) AS rank,
          climber_name, team_name, total_points, total_tops, total_attempts
        FROM scored
        ORDER BY rank
      `, [cat.category_id])

      if (lb.rows.length > 0) {
        const sheetName = cat.category_name.substring(0, 31) // Excel sheet name max 31 chars
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lb.rows), sheetName)
      }
    }

    // ── Sheet: Finals Results ─────────────────────────────────────────────────
    const finals = await db.query(`
      SELECT
        fc.climber_id, fc.name, fc.category, fc.organisation,
        SUM(fr.has_top::int)  AS tops,
        SUM(fr.has_zone::int) AS zones,
        SUM(fr.attempts_to_top)  AS attempts_to_top,
        SUM(fr.attempts_to_zone) AS attempts_to_zone,
        SUM(fr.score) AS total_score,
        fc.qualifying_rank
      FROM finals_results fr
      JOIN finals_climbers fc ON fr.climber_id = fc.climber_id
      GROUP BY fc.climber_id, fc.name, fc.category, fc.organisation, fc.qualifying_rank
      ORDER BY fc.category, total_score DESC
    `)
    if (finals.rows.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finals.rows), 'Finals')
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const filename = `event-export-${new Date().toISOString().slice(0, 10)}.xlsx`

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export event error:', error)
    return Response.json({ message: 'Export failed.' }, { status: 500 })
  }
}
