import { db } from '@/lib/db'

export async function GET() {
  try {
    const result = await db.query(`
      WITH climber_scores AS (
        SELECT
          fc.climber_id, fc.name, fc.category, fc.organisation, fc.qualifying_rank,
          COALESCE(SUM(fr.score), 0) AS total_score,
          COALESCE(SUM(CASE WHEN fr.has_top THEN
            CASE WHEN (fc.category ILIKE '%team%' OR fc.category ILIKE '%double%' OR fc.category ILIKE '%obg%') AND fc.gender = 'Female' THEN 2 ELSE 1 END
          ELSE 0 END), 0) AS total_tops,
          COALESCE(SUM(CASE WHEN fr.has_top OR fr.has_zone THEN
            CASE WHEN (fc.category ILIKE '%team%' OR fc.category ILIKE '%double%' OR fc.category ILIKE '%obg%') AND fc.gender = 'Female' THEN 2 ELSE 1 END
          ELSE 0 END), 0) AS total_zones,
          COALESCE(SUM(fr.attempts_to_top), 0) AS total_att_to_top,
          COALESCE(SUM(fr.attempts_to_zone), 0) AS total_att_to_zone,
          JSONB_AGG(JSONB_BUILD_OBJECT(
            'result_id', fr.result_id,
            'route_name', frt.route_name,
            'has_top', fr.has_top,
            'has_zone', fr.has_zone,
            'att_top', COALESCE(fr.attempts_to_top, 0),
            'att_zone', COALESCE(fr.attempts_to_zone, 0),
            'score', fr.score
          )) FILTER (WHERE frt.route_name IS NOT NULL) AS route_details
        FROM finals_climbers fc
        LEFT JOIN finals_results fr ON fc.climber_id = fr.climber_id
        LEFT JOIN finals_routes frt ON fr.route_id = frt.route_id
        GROUP BY fc.climber_id, fc.name, fc.category, fc.organisation, fc.qualifying_rank, fc.gender
      )
      SELECT *,
        RANK() OVER (
          ORDER BY total_score DESC, total_tops DESC, total_zones DESC,
            total_att_to_top ASC, total_att_to_zone ASC,
            qualifying_rank ASC NULLS LAST
        ) AS rank
      FROM climber_scores
      ORDER BY rank, climber_id
    `)

    return Response.json(result.rows.map(row => ({
      rank: parseInt(row.rank),
      climberId: row.climber_id,
      name: row.name,
      category: row.category,
      organisation: row.organisation,
      score: parseFloat(row.total_score || 0),
      topCount: parseInt(row.total_tops || 0),
      zoneCount: parseInt(row.total_zones || 0),
      attemptsToTop: parseInt(row.total_att_to_top || 0),
      attemptsToZone: parseInt(row.total_att_to_zone || 0),
      qualifyingRank: row.qualifying_rank,
      routeDetails: row.route_details || [],
    })))
  } catch (error) {
    console.error('Error fetching finals leaderboard:', error)
    return Response.json({ message: 'Failed to fetch leaderboard.' }, { status: 500 })
  }
}
