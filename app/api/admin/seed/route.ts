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
  { route_id:  1, route_name: 'First Steps',          difficulty_points: 40  },
  { route_id:  2, route_name: "Beginner's Wall",       difficulty_points: 42  },
  { route_id:  3, route_name: 'Easy Traverse',         difficulty_points: 44  },
  { route_id:  4, route_name: 'Slab Dance',            difficulty_points: 46  },
  { route_id:  5, route_name: 'Footwork Drill',        difficulty_points: 48  },
  { route_id:  6, route_name: 'Crimp Line',            difficulty_points: 50  },
  { route_id:  7, route_name: 'Pocket Wall',           difficulty_points: 52  },
  { route_id:  8, route_name: 'Sloper Rail',           difficulty_points: 54  },
  { route_id:  9, route_name: 'Pinch Corner',          difficulty_points: 56  },
  { route_id: 10, route_name: 'Compression Slab',      difficulty_points: 58  },
  { route_id: 11, route_name: 'Dynamo Start',          difficulty_points: 60  },
  { route_id: 12, route_name: 'Technical Face',        difficulty_points: 62  },
  { route_id: 13, route_name: 'Overhang Intro',        difficulty_points: 64  },
  { route_id: 14, route_name: 'Power Endurance',       difficulty_points: 66  },
  { route_id: 15, route_name: 'The Crux',              difficulty_points: 68  },
  { route_id: 16, route_name: 'Volume Master',         difficulty_points: 70  },
  { route_id: 17, route_name: 'Roof Crack',            difficulty_points: 72  },
  { route_id: 18, route_name: 'Deadpoint Wall',        difficulty_points: 74  },
  { route_id: 19, route_name: 'Two-Finger Pocket',     difficulty_points: 76  },
  { route_id: 20, route_name: 'Core Crusher',          difficulty_points: 78  },
  { route_id: 21, route_name: 'Heel Hook Heaven',      difficulty_points: 80  },
  { route_id: 22, route_name: 'Shoulder Burner',       difficulty_points: 82  },
  { route_id: 23, route_name: 'Tendon Tester',         difficulty_points: 84  },
  { route_id: 24, route_name: 'Mantle Shelf',          difficulty_points: 86  },
  { route_id: 25, route_name: 'Knee Bar Challenge',    difficulty_points: 88  },
  { route_id: 26, route_name: 'The Gauntlet',          difficulty_points: 90  },
  { route_id: 27, route_name: 'Black Diamond',         difficulty_points: 92  },
  { route_id: 28, route_name: 'Project Wall',          difficulty_points: 95  },
  { route_id: 29, route_name: 'Grand Master',          difficulty_points: 98  },
  { route_id: 30, route_name: 'The Final Boss',        difficulty_points: 100 },
]

// skill: 1 (beginner) → 10 (elite). Determines which routes are attempted/topped.
const CLIMBERS = [
  // Open Male (C001–C010)
  { climber_id: 'C001', name: 'Ahmad Hakimi',     gender: 'Male',   age: 24, team_name: 'Vertical KL',  category: 'Open Male',      skill: 10 },
  { climber_id: 'C002', name: 'Faris Izzat',      gender: 'Male',   age: 26, team_name: 'Bloc Society',  category: 'Open Male',      skill: 9  },
  { climber_id: 'C003', name: 'Hazwan Arif',      gender: 'Male',   age: 23, team_name: 'Summit Club',   category: 'Open Male',      skill: 8  },
  { climber_id: 'C004', name: 'Irfan Syazwan',    gender: 'Male',   age: 27, team_name: 'Vertical KL',   category: 'Open Male',      skill: 7  },
  { climber_id: 'C005', name: 'Zulhilmi Azri',    gender: 'Male',   age: 22, team_name: 'Grip Masters',  category: 'Open Male',      skill: 6  },
  { climber_id: 'C006', name: 'Danial Fikri',     gender: 'Male',   age: 25, team_name: 'Summit Club',   category: 'Open Male',      skill: 5  },
  { climber_id: 'C007', name: 'Ridhwan Luqman',   gender: 'Male',   age: 21, team_name: 'Bloc Society',  category: 'Open Male',      skill: 4  },
  { climber_id: 'C008', name: 'Naqib Zakwan',     gender: 'Male',   age: 20, team_name: 'Vertical KL',   category: 'Open Male',      skill: 3  },
  { climber_id: 'C009', name: 'Afiq Syahmi',      gender: 'Male',   age: 19, team_name: 'Grip Masters',  category: 'Open Male',      skill: 2  },
  { climber_id: 'C010', name: 'Harith Haziq',     gender: 'Male',   age: 18, team_name: 'Summit Club',   category: 'Open Male',      skill: 1  },

  // Open Female (C011–C020)
  { climber_id: 'C011', name: 'Aima Zulaikha',    gender: 'Female', age: 23, team_name: 'Vertical KL',   category: 'Open Female',    skill: 10 },
  { climber_id: 'C012', name: 'Nurul Izzah',      gender: 'Female', age: 25, team_name: 'Summit Club',   category: 'Open Female',    skill: 9  },
  { climber_id: 'C013', name: 'Siti Rahayu',      gender: 'Female', age: 27, team_name: 'Bloc Society',  category: 'Open Female',    skill: 8  },
  { climber_id: 'C014', name: 'Fatin Nabilah',    gender: 'Female', age: 21, team_name: 'Grip Masters',  category: 'Open Female',    skill: 7  },
  { climber_id: 'C015', name: 'Yasmin Adlina',    gender: 'Female', age: 24, team_name: 'Summit Club',   category: 'Open Female',    skill: 6  },
  { climber_id: 'C016', name: 'Aina Sofiya',      gender: 'Female', age: 22, team_name: 'Vertical KL',   category: 'Open Female',    skill: 5  },
  { climber_id: 'C017', name: 'Syaza Nurfatin',   gender: 'Female', age: 20, team_name: 'Bloc Society',  category: 'Open Female',    skill: 4  },
  { climber_id: 'C018', name: 'Nabilah Husna',    gender: 'Female', age: 26, team_name: 'Grip Masters',  category: 'Open Female',    skill: 3  },
  { climber_id: 'C019', name: 'Liyana Aziz',      gender: 'Female', age: 19, team_name: 'Vertical KL',   category: 'Open Female',    skill: 2  },
  { climber_id: 'C020', name: 'Rania Zahra',      gender: 'Female', age: 18, team_name: 'Summit Club',   category: 'Open Female',    skill: 1  },

  // Youth A Male (C021–C030)
  { climber_id: 'C021', name: 'Zikri Hafeez',     gender: 'Male',   age: 17, team_name: 'Youth Rising',  category: 'Youth A Male',   skill: 10 },
  { climber_id: 'C022', name: 'Arif Hamdan',      gender: 'Male',   age: 16, team_name: 'Vertical KL',   category: 'Youth A Male',   skill: 9  },
  { climber_id: 'C023', name: 'Darwisyah Amir',   gender: 'Male',   age: 18, team_name: 'Youth Rising',  category: 'Youth A Male',   skill: 8  },
  { climber_id: 'C024', name: 'Iman Hafiz',       gender: 'Male',   age: 17, team_name: 'Bloc Society',  category: 'Youth A Male',   skill: 7  },
  { climber_id: 'C025', name: 'Luqmanul Hakim',   gender: 'Male',   age: 16, team_name: 'Summit Club',   category: 'Youth A Male',   skill: 6  },
  { climber_id: 'C026', name: 'Mikhail Redzuan',  gender: 'Male',   age: 15, team_name: 'Youth Rising',  category: 'Youth A Male',   skill: 5  },
  { climber_id: 'C027', name: 'Suffian Nazar',    gender: 'Male',   age: 17, team_name: 'Vertical KL',   category: 'Youth A Male',   skill: 4  },
  { climber_id: 'C028', name: 'Umar Faruq',       gender: 'Male',   age: 16, team_name: 'Bloc Society',  category: 'Youth A Male',   skill: 3  },
  { climber_id: 'C029', name: 'Wafiy Rusydan',    gender: 'Male',   age: 15, team_name: 'Youth Rising',  category: 'Youth A Male',   skill: 2  },
  { climber_id: 'C030', name: 'Yusuf Alwi',       gender: 'Male',   age: 14, team_name: 'Summit Club',   category: 'Youth A Male',   skill: 1  },

  // Youth A Female (C031–C040)
  { climber_id: 'C031', name: 'Hana Sofea',       gender: 'Female', age: 17, team_name: 'Youth Rising',  category: 'Youth A Female', skill: 10 },
  { climber_id: 'C032', name: 'Aliya Nadira',     gender: 'Female', age: 16, team_name: 'Vertical KL',   category: 'Youth A Female', skill: 9  },
  { climber_id: 'C033', name: 'Batrisyia Nuur',   gender: 'Female', age: 18, team_name: 'Bloc Society',  category: 'Youth A Female', skill: 8  },
  { climber_id: 'C034', name: 'Dhia Farhana',     gender: 'Female', age: 17, team_name: 'Youth Rising',  category: 'Youth A Female', skill: 7  },
  { climber_id: 'C035', name: 'Elyana Maisara',   gender: 'Female', age: 16, team_name: 'Summit Club',   category: 'Youth A Female', skill: 6  },
  { climber_id: 'C036', name: 'Farah Insyirah',   gender: 'Female', age: 15, team_name: 'Youth Rising',  category: 'Youth A Female', skill: 5  },
  { climber_id: 'C037', name: 'Ghina Nadhirah',   gender: 'Female', age: 17, team_name: 'Vertical KL',   category: 'Youth A Female', skill: 4  },
  { climber_id: 'C038', name: 'Hayfa Yasmin',     gender: 'Female', age: 16, team_name: 'Bloc Society',  category: 'Youth A Female', skill: 3  },
  { climber_id: 'C039', name: 'Iris Zafirah',     gender: 'Female', age: 15, team_name: 'Youth Rising',  category: 'Youth A Female', skill: 2  },
  { climber_id: 'C040', name: 'Jannah Safiyyah',  gender: 'Female', age: 14, team_name: 'Summit Club',   category: 'Youth A Female', skill: 1  },
]

// ── Deterministic result generator ───────────────────────────────────────────
// skill 1–10 determines how far up the difficulty ladder an athlete reaches.
// All generated values are deterministic — no Math.random().
type ResultRow = [string, number, string, number, boolean]

function generateResultsForClimber(climberId: string, skillLevel: number): ResultRow[] {
  const n = ROUTES.length                     // 30
  const reach = skillLevel / 10              // 0.1 → 1.0: fraction of routes reachable
  const results: ResultRow[] = []

  ROUTES.forEach((route, i) => {
    const pct = i / (n - 1)                  // 0 = easiest, 1 = hardest

    // Only attempt routes within skill reach (+0.15 buffer for failed attempts)
    if (pct > reach + 0.15) return

    const isTop = pct < reach - 0.05        // tops routes clearly below their ceiling

    // Attempts: harder routes relative to skill level take more tries
    const relHardness = pct / reach          // 0 = trivial, 1 = at limit
    const attempts = isTop
      ? Math.max(1, Math.round(relHardness * (11 - skillLevel) * 0.4 + 1))
      : Math.min(5, Math.round(relHardness * 3 + 1))

    results.push([climberId, route.route_id, isTop ? 'top' : 'attempt', attempts, isTop])
  })

  return results
}

const ALL_RESULTS: ResultRow[] = CLIMBERS.flatMap(c =>
  generateResultsForClimber(c.climber_id, c.skill)
)

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
        parseInt(routeCount.rows[0].count)   > 0,
      climberCount: parseInt(climberCount.rows[0].count),
      routeCount:   parseInt(routeCount.rows[0].count),
      resultCount:  parseInt(resultCount.rows[0].count),
    })
  } catch (error) {
    console.error('Seed check error:', error)
    return Response.json({ message: 'Failed to check data.' }, { status: 500 })
  }
}

// ── POST: seed sample data ────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { confirmation } = await req.json().catch(() => ({ confirmation: '' }))

    // Check for existing data
    const [climberCheck, routeCheck] = await Promise.all([
      db.query('SELECT COUNT(*) FROM climbers'),
      db.query('SELECT COUNT(*) FROM routes'),
    ])
    const hasData =
      parseInt(climberCheck.rows[0].count) > 0 ||
      parseInt(routeCheck.rows[0].count)   > 0

    if (hasData && confirmation !== 'overwrite data') {
      return Response.json(
        { message: 'Existing data detected. Type "overwrite data" to confirm.', hasData: true },
        { status: 409 }
      )
    }

    const client = await db.connect()
    try {
      await client.query('BEGIN')

      // ── 1. Wipe event tables (preserves judges + categories) ────────────
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

      // ── 2. Upsert categories ─────────────────────────────────────────────
      for (const cat of CATEGORIES) {
        await client.query(
          'INSERT INTO categories (category_name) VALUES ($1) ON CONFLICT (category_name) DO NOTHING',
          [cat.category_name]
        )
      }

      // Resolve category name → id
      const catResult = await client.query('SELECT category_id, category_name FROM categories')
      const catMap = new Map<string, number>(catResult.rows.map(r => [r.category_name, r.category_id]))

      // ── 3. Insert all 30 routes ──────────────────────────────────────────
      for (const route of ROUTES) {
        await client.query(
          'INSERT INTO routes (route_id, route_name, difficulty_points) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [route.route_id, route.route_name, route.difficulty_points]
        )
      }

      // ── 4. Insert 40 climbers + category assignments ─────────────────────
      // Note: route_category_link references finals_routes (not routes), so
      // qualifier routes need no category link — category is inferred from the
      // climber's own registration when a judge submits a score.
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

      // ── 5. Insert generated qualifier results ────────────────────────────
      for (const [climber_id, route_id, score_type, attempts, is_top] of ALL_RESULTS) {
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
        message: `Sample data loaded — ${CLIMBERS.length} athletes, ${ROUTES.length} routes, ${ALL_RESULTS.length} results across ${CATEGORIES.length} categories.`,
        athletes:   CLIMBERS.length,
        routes:     ROUTES.length,
        results:    ALL_RESULTS.length,
        categories: CATEGORIES.length,
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
