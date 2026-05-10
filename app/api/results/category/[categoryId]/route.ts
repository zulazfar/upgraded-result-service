import { db } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  try {
    const { categoryId } = await params
    const categoryIdInt = parseInt(categoryId)
    if (isNaN(categoryIdInt)) return Response.json({ message: 'Invalid category ID.' }, { status: 400 })

    const nameResult = await db.query('SELECT category_name FROM categories WHERE category_id=$1', [categoryIdInt])
    if (nameResult.rows.length === 0) return Response.json({ message: 'Category not found.' }, { status: 404 })

    const categoryName = nameResult.rows[0].category_name
    const lower = categoryName.toLowerCase()
    const isTeamOrDouble = lower.includes('team') || lower.includes('double')
    const isOBG = lower.includes('obg')

    let query: string

    if (isTeamOrDouble) {
      query = `
        WITH LatestScores AS (
          SELECT r.result_id, r.climber_id, r.route_id, r.attempts, r.is_top, r.points_awarded, r.category_id,
            ROW_NUMBER() OVER (PARTITION BY r.climber_id, r.route_id ORDER BY r.timestamp DESC) as rn
          FROM results r
          JOIN climber_categories cc ON r.climber_id = cc.climber_id
          WHERE cc.category_id = ${categoryIdInt}
        ),
        FinalScores AS (SELECT * FROM LatestScores WHERE rn = 1),
        ClimberAggregates AS (
          SELECT c.climber_id, c.name AS climber_name, c.team_name, c.gender,
            COALESCE(SUM(fs.points_awarded), 0) AS total_points,
            COALESCE(SUM(CASE WHEN fs.is_top THEN 1 ELSE 0 END), 0) AS total_tops,
            COALESCE(SUM(fs.attempts) FILTER (WHERE fs.is_top), 0) AS total_attempts,
            COALESCE(JSON_AGG(JSON_BUILD_OBJECT('result_id',fs.result_id,'route_id',fs.route_id,'attempts',fs.attempts,'is_top',fs.is_top,'points',fs.points_awarded))
              FILTER (WHERE fs.route_id IS NOT NULL), '[]') AS route_attempts_detail
          FROM climbers c
          JOIN climber_categories cc ON c.climber_id = cc.climber_id
          LEFT JOIN FinalScores fs ON c.climber_id = fs.climber_id
          WHERE cc.category_id = ${categoryIdInt}
          GROUP BY c.climber_id, c.name, c.team_name, c.gender
        )
        SELECT ca.team_name,
          SUM(ca.total_points) AS total_points,
          SUM(ca.total_attempts) AS total_attempts,
          SUM(CASE WHEN ca.gender = 'Female' THEN ca.total_tops * 2 ELSE ca.total_tops END) AS total_tops,
          JSON_AGG(JSON_BUILD_OBJECT('climber_id',ca.climber_id,'climber_name',ca.climber_name,'total_tops',ca.total_tops,'total_points',ca.total_points,'route_attempts_detail',ca.route_attempts_detail)) AS member_details
        FROM ClimberAggregates ca
        GROUP BY ca.team_name
        ORDER BY total_points DESC, total_attempts ASC`
    } else if (isOBG) {
      query = `
        WITH LatestScores AS (
          SELECT r.result_id, r.climber_id, r.route_id, r.attempts, r.is_top, r.points_awarded,
            ROW_NUMBER() OVER (PARTITION BY r.climber_id, r.route_id ORDER BY r.timestamp DESC) as rn
          FROM results r WHERE r.category_id = ${categoryIdInt}
        ),
        FinalScores AS (SELECT * FROM LatestScores WHERE rn = 1)
        SELECT c.climber_id, c.name AS climber_name, c.team_name,
          COALESCE(SUM(fs.points_awarded), 0) AS total_points,
          COALESCE(SUM(CASE WHEN fs.is_top THEN 1 ELSE 0 END), 0) AS total_tops,
          COALESCE(SUM(fs.attempts) FILTER (WHERE fs.is_top), 0) AS total_attempts,
          COALESCE(JSON_AGG(JSON_BUILD_OBJECT('result_id',fs.result_id,'route_id',fs.route_id,'attempts',fs.attempts,'is_top',fs.is_top,'points',fs.points_awarded))
            FILTER (WHERE fs.route_id IS NOT NULL), '[]') AS route_attempts_detail
        FROM climbers c
        JOIN climber_categories cc ON c.climber_id = cc.climber_id
        LEFT JOIN FinalScores fs ON c.climber_id = fs.climber_id
        WHERE cc.category_id = ${categoryIdInt}
        GROUP BY c.climber_id, c.name, c.team_name
        ORDER BY total_points DESC, total_attempts ASC`
    } else {
      query = `
        WITH LatestScores AS (
          SELECT r.result_id, r.climber_id, r.route_id, r.attempts, r.is_top, r.points_awarded,
            ROW_NUMBER() OVER (PARTITION BY r.climber_id, r.route_id ORDER BY r.timestamp DESC) as rn
          FROM results r WHERE r.category_id = ${categoryIdInt}
        ),
        FinalScores AS (SELECT * FROM LatestScores WHERE rn = 1),
        RankedScores AS (
          SELECT climber_id, points_awarded,
            ROW_NUMBER() OVER (PARTITION BY climber_id ORDER BY points_awarded DESC) as score_rank
          FROM FinalScores WHERE points_awarded > 0
        ),
        Top5Sums AS (
          SELECT climber_id, SUM(points_awarded) as top_5_points
          FROM RankedScores WHERE score_rank <= 5 GROUP BY climber_id
        ),
        HighestScore AS (
          SELECT climber_id, MAX(points_awarded) as max_single_score
          FROM FinalScores GROUP BY climber_id
        )
        SELECT c.climber_id, c.name AS climber_name, c.team_name,
          COALESCE(t5s.top_5_points, 0) AS total_points,
          COALESCE(hs.max_single_score, 0) AS tie_breaker_score,
          COALESCE(SUM(CASE WHEN fs.is_top THEN 1 ELSE 0 END), 0) AS total_tops,
          COALESCE(SUM(fs.attempts) FILTER (WHERE fs.is_top), 0) AS total_attempts,
          COALESCE(JSON_AGG(JSON_BUILD_OBJECT('result_id',fs.result_id,'route_id',fs.route_id,'attempts',fs.attempts,'is_top',fs.is_top,'points',fs.points_awarded))
            FILTER (WHERE fs.route_id IS NOT NULL), '[]') AS route_attempts_detail
        FROM climbers c
        JOIN climber_categories cc ON c.climber_id = cc.climber_id
        LEFT JOIN FinalScores fs ON c.climber_id = fs.climber_id
        LEFT JOIN Top5Sums t5s ON c.climber_id = t5s.climber_id
        LEFT JOIN HighestScore hs ON c.climber_id = hs.climber_id
        WHERE cc.category_id = ${categoryIdInt}
        GROUP BY c.climber_id, c.name, c.team_name, t5s.top_5_points, hs.max_single_score
        ORDER BY total_points DESC, total_attempts ASC, tie_breaker_score DESC`
    }

    const result = await db.query(query)
    return Response.json({ category_name: categoryName, is_team_category: isTeamOrDouble, results: result.rows })
  } catch (error) {
    console.error('Error fetching category results:', error)
    return Response.json({ message: 'Failed to fetch results.' }, { status: 500 })
  }
}
