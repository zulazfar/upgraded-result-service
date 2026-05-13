import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ── Sample data ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { category_name: 'Open Male' },
  { category_name: 'Open Female' },
  { category_name: 'Youth A Male' },
  { category_name: 'Youth A Female' },
]

const ROUTES = [
  { route_id: 1,  route_name: 'Slab Intro',      difficulty_points: 50  },
  { route_id: 2,  route_name: 'Crimpy Wall',      difficulty_points: 55  },
  { route_id: 3,  route_name: 'The Overhang',     difficulty_points: 60  },
  { route_id: 4,  route_name: 'Pocket Puzzle',    difficulty_points: 65  },
  { route_id: 5,  route_name: 'Pinch Fest',       difficulty_points: 70  },
  { route_id: 6,  route_name: 'Dyno Wall',        difficulty_points: 75  },
  { route_id: 7,  route_name: 'Compression Zone', difficulty_points: 80  },
  { route_id: 8,  route_name: 'Roof Line',        difficulty_points: 85  },
  { route_id: 9,  route_name: 'Volume Sequence',  difficulty_points: 90  },
  { route_id: 10, route_name: 'The Final Boss',   difficulty_points: 100 },
]

const CLIMBERS: { climber_id: string; name: string; gender: string; age: number; team_name: string; category: string }[] = [
  // Open Male
  { climber_id: 'C001', name: 'Ahmad Hakimi',    gender: 'Male',   age: 23, team_name: 'Vertical KL',    category: 'Open Male' },
  { climber_id: 'C002', name: 'Faris Izzat',     gender: 'Male',   age: 25, team_name: 'Bloc Society',   category: 'Open Male' },
  { climber_id: 'C003', name: 'Hazwan Arif',     gender: 'Male',   age: 22, team_name: 'Summit Club',    category: 'Open Male' },
  { climber_id: 'C004', name: 'Irfan Syazwan',   gender: 'Male',   age: 27, team_name: 'Vertical KL',    category: 'Open Male' },
  { climber_id: 'C005', name: 'Zulhilmi Azri',   gender: 'Male',   age: 21, team_name: 'Grip Masters',   category: 'Open Male' },
  // Open Female
  { climber_id: 'C006', name: 'Aima Zulaikha',   gender: 'Female', age: 22, team_name: 'Vertical KL',    category: 'Open Female' },
  { climber_id: 'C007', name: 'Nurul Izzah',     gender: 'Female', age: 24, team_name: 'Summit Club',    category: 'Open Female' },
  { climber_id: 'C008', name: 'Siti Rahayu',     gender: 'Female', age: 26, team_name: 'Bloc Society',   category: 'Open Female' },
  { climber_id: 'C009', name: 'Fatin Nabilah',   gender: 'Female', age: 20, team_name: 'Grip Masters',   category: 'Open Female' },
  { climber_id: 'C010', name: 'Yasmin Adlina',   gender: 'Female', age: 23, team_name: 'Summit Club',    category: 'Open Female' },
  // Youth A Male
  { climber_id: 'C011', name: 'Harith Haziq',    gender: 'Male',   age: 17, team_name: 'Youth Rising',   category: 'Youth A Male' },
  { climber_id: 'C012', name: 'Naqib Zakwan',    gender: 'Male',   age: 16, team_name: 'Vertical KL',    category: 'Youth A Male' },
  { climber_id: 'C013', name: 'Arif Hamdan',     gender: 'Male',   age: 18, team_name: 'Youth Rising',   category: 'Youth A Male' },
  { climber_id: 'C014', name: 'Ridhwan Luqman',  gender: 'Male',   age: 17, team_name: 'Bloc Society',   category: 'Youth A Male' },
  { climber_id: 'C015', name: 'Afiq Syahmi',     gender: 'Male',   age: 16, team_name: 'Summit Club',    category: 'Youth A Male' },
  // Youth A Female
  { climber_id: 'C016', name: 'Hana Sofea',      gender: 'Female', age: 17, team_name: 'Youth Rising',   category: 'Youth A Female' },
  { climber_id: 'C017', name: 'Aliya Nadira',    gender: 'Female', age: 16, team_name: 'Vertical KL',    category: 'Youth A Female' },
  { climber_id: 'C018', name: 'Mia Zahra',       gender: 'Female', age: 18, team_name: 'Bloc Society',   category: 'Youth A Female' },
  { climber_id: 'C019', name: 'Insyirah Amani',  gender: 'Female', age: 17, team_name: 'Youth Rising',   category: 'Youth A Female' },
  { climber_id: 'C020', name: 'Nur Fareeha',     gender: 'Female', age: 16, team_name: 'Summit Club',    category: 'Youth A Female' },
]

// [climber_id, route_id, score_type, attempts, is_top]
type ResultRow = [string, number, string, number, boolean]

const RESULTS: ResultRow[] = [
  // C001 Ahmad Hakimi – strong competitor (5 tops)
  ['C001', 1, 'top',     1, true],  ['C001', 2, 'top',     2, true],
  ['C001', 3, 'top',     1, true],  ['C001', 4, 'top',     3, true],
  ['C001', 5, 'top',     2, true],  ['C001', 6, 'attempt', 3, false],
  // C002 Faris Izzat – 4 tops
  ['C002', 1, 'top',     1, true],  ['C002', 2, 'top',     1, true],
  ['C002', 3, 'top',     2, true],  ['C002', 4, 'top',     4, true],
  ['C002', 5, 'attempt', 2, false], ['C002', 6, 'attempt', 1, false],
  // C003 Hazwan Arif – 3 tops
  ['C003', 1, 'top',     2, true],  ['C003', 2, 'top',     1, true],
  ['C003', 3, 'top',     3, true],  ['C003', 4, 'attempt', 2, false],
  ['C003', 5, 'attempt', 3, false],
  // C004 Irfan Syazwan – 2 tops
  ['C004', 1, 'top',     1, true],  ['C004', 2, 'top',     2, true],
  ['C004', 3, 'attempt', 4, false], ['C004', 4, 'attempt', 2, false],
  // C005 Zulhilmi Azri – 1 top
  ['C005', 1, 'top',     3, true],  ['C005', 2, 'attempt', 2, false],
  ['C005', 3, 'attempt', 3, false],

  // C006 Aima Zulaikha – 5 tops
  ['C006', 1, 'top',     1, true],  ['C006', 2, 'top',     1, true],
  ['C006', 3, 'top',     1, true],  ['C006', 4, 'top',     2, true],
  ['C006', 5, 'top',     2, true],  ['C006', 6, 'attempt', 2, false],
  // C007 Nurul Izzah – 4 tops
  ['C007', 1, 'top',     1, true],  ['C007', 2, 'top',     2, true],
  ['C007', 3, 'top',     1, true],  ['C007', 4, 'top',     3, true],
  ['C007', 5, 'attempt', 3, false],
  // C008 Siti Rahayu – 3 tops
  ['C008', 1, 'top',     2, true],  ['C008', 2, 'top',     2, true],
  ['C008', 3, 'top',     2, true],  ['C008', 4, 'attempt', 3, false],
  // C009 Fatin Nabilah – 2 tops
  ['C009', 1, 'top',     1, true],  ['C009', 2, 'top',     3, true],
  ['C009', 3, 'attempt', 2, false],
  // C010 Yasmin Adlina – 1 top
  ['C010', 1, 'top',     2, true],  ['C010', 2, 'attempt', 4, false],

  // C011 Harith Haziq – 4 tops
  ['C011', 1, 'top',     1, true],  ['C011', 2, 'top',     1, true],
  ['C011', 3, 'top',     2, true],  ['C011', 4, 'top',     2, true],
  ['C011', 5, 'attempt', 3, false],
  // C012 Naqib Zakwan – 3 tops
  ['C012', 1, 'top',     2, true],  ['C012', 2, 'top',     1, true],
  ['C012', 3, 'top',     3, true],  ['C012', 4, 'attempt', 2, false],
  // C013 Arif Hamdan – 2 tops
  ['C013', 1, 'top',     1, true],  ['C013', 2, 'top',     2, true],
  ['C013', 3, 'attempt', 3, false],
  // C014 Ridhwan Luqman – 1 top
  ['C014', 1, 'top',     3, true],  ['C014', 2, 'attempt', 2, false],
  // C015 Afiq Syahmi – 1 top
  ['C015', 1, 'top',     2, true],  ['C015', 2, 'attempt', 3, false],

  // C016 Hana Sofea – 4 tops
  ['C016', 1, 'top',     1, true],  ['C016', 2, 'top',     1, true],
  ['C016', 3, 'top',     2, true],  ['C016', 4, 'top',     1, true],
  ['C016', 5, 'attempt', 3, false],
  // C017 Aliya Nadira – 3 tops
  ['C017', 1, 'top',     1, true],  ['C017', 2, 'top',     2, true],
  ['C017', 3, 'top',     2, true],  ['C017', 4, 'attempt', 2, false],
  // C018 Mia Zahra – 2 tops
  ['C018', 1, 'top',     2, true],  ['C018', 2, 'top',     3, true],
  ['C018', 3, 'attempt', 3, false],
  // C019 Insyirah Amani – 1 top
  ['C019', 1, 'top',     1, true],  ['C019', 2, 'attempt', 2, false],
  // C020 Nur Fareeha – 1 top
  ['C020', 1, 'top',     3, true],  ['C020', 2, 'attempt', 4, false],
]

// ── GET: check whether event tables already have data ────────────────────────
export async function GET() {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const [climberCount, routeCount, resultCount] = await Promise.all([
      db.query('SELECT COUNT(*) FROM climbers'),
      db.query('SELECT COUNT(*) FROM routes'),
      db.query('SELECT COUNT(*) FROM results'),
    ])

    return Response.json({
      hasData:
        parseInt(climberCount.rows[0].count) > 0 ||
        parseInt(routeCount.rows[0].count) > 0,
      climberCount: parseInt(climberCount.rows[0].count),
      routeCount:   parseInt(routeCount.rows[0].count),
      resultCount:  parseInt(resultCount.rows[0].count),
    })
  } catch (error) {
    console.error('Seed check error:', error)
    return Response.json({ message: 'Failed to check data.' }, { status: 500 })
  }
}

// ── POST: seed sample data (requires confirmation if data exists) ─────────────
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { confirmation } = await req.json().catch(() => ({ confirmation: '' }))

    // Check for existing data
    const climberCheck = await db.query('SELECT COUNT(*) FROM climbers')
    const routeCheck   = await db.query('SELECT COUNT(*) FROM routes')
    const hasData =
      parseInt(climberCheck.rows[0].count) > 0 ||
      parseInt(routeCheck.rows[0].count) > 0

    if (hasData && confirmation !== 'overwrite data') {
      return Response.json(
        { message: 'Existing data detected. Type "overwrite data" to confirm.', hasData: true },
        { status: 409 }
      )
    }

    const client = await db.connect()
    try {
      await client.query('BEGIN')

      // ── 1. Wipe event tables (same scope as reset) ──────────────────────
      if (hasData) {
        await client.query(`
          TRUNCATE
            finals_results,
            route_category_link,
            finals_routes,
            finals_climbers,
            results,
            climber_categories,
            climbers,
            routes
          RESTART IDENTITY CASCADE
        `)
      }

      // ── 2. Upsert categories (keep existing ones, add missing) ──────────
      for (const cat of CATEGORIES) {
        await client.query(
          'INSERT INTO categories (category_name) VALUES ($1) ON CONFLICT (category_name) DO NOTHING',
          [cat.category_name]
        )
      }

      // Fetch category name → id map
      const catResult = await client.query('SELECT category_id, category_name FROM categories')
      const catMap = new Map<string, number>(catResult.rows.map(r => [r.category_name, r.category_id]))

      // ── 3. Insert routes ────────────────────────────────────────────────
      for (const route of ROUTES) {
        await client.query(
          'INSERT INTO routes (route_id, route_name, difficulty_points) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [route.route_id, route.route_name, route.difficulty_points]
        )
      }

      // ── 4. Link routes to all categories ───────────────────────────────
      for (const route of ROUTES) {
        for (const cat of CATEGORIES) {
          const catId = catMap.get(cat.category_name)
          if (catId) {
            await client.query(
              'INSERT INTO route_category_link (route_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [route.route_id, catId]
            )
          }
        }
      }

      // ── 5. Insert climbers + category links ─────────────────────────────
      for (const c of CLIMBERS) {
        await client.query(
          `INSERT INTO climbers (climber_id, name, gender, age, team_name)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
          [c.climber_id, c.name, c.gender, c.age, c.team_name]
        )
        const catId = catMap.get(c.category)
        if (catId) {
          await client.query(
            'INSERT INTO climber_categories (climber_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [c.climber_id, catId]
          )
        }
      }

      // ── 6. Insert results ───────────────────────────────────────────────
      for (const [climber_id, route_id, score_type, attempts, is_top] of RESULTS) {
        const climber = CLIMBERS.find(c => c.climber_id === climber_id)!
        const catId   = catMap.get(climber.category)!
        const route   = ROUTES.find(r => r.route_id === route_id)!
        const points  = is_top ? route.difficulty_points : 0

        await client.query(
          `INSERT INTO results (climber_id, route_id, score_type, attempts, points_awarded, is_top, category_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [climber_id, route_id, score_type, attempts, points, is_top, catId]
        )
      }

      await client.query('COMMIT')

      return Response.json({
        message: `Sample data loaded — ${CLIMBERS.length} athletes, ${ROUTES.length} routes, ${RESULTS.length} results across ${CATEGORIES.length} categories.`,
        climbers: CLIMBERS.length,
        routes:   ROUTES.length,
        results:  RESULTS.length,
      })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Seed error:', error)
    return Response.json({ message: 'Seed failed.' }, { status: 500 })
  }
}
