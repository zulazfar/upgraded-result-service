import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isSuperAdmin) return Response.json({ message: 'Forbidden.' }, { status: 403 })

    const { confirmation } = await req.json()
    if (confirmation !== 'delete event') {
      return Response.json({ message: 'Incorrect confirmation text.' }, { status: 400 })
    }

    // Wipe all event data — preserve judges and categories
    await db.query(`
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

    return Response.json({ message: 'Event data cleared successfully.' })
  } catch (error) {
    console.error('Reset error:', error)
    return Response.json({ message: 'Reset failed.' }, { status: 500 })
  }
}
