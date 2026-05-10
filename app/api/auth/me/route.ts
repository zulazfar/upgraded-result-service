import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn) {
    return Response.json({ message: 'Not authenticated.' }, { status: 401 })
  }
  return Response.json({
    judgeId: session.judgeId,
    judgeName: session.judgeName,
    isSuperAdmin: session.isSuperAdmin,
  })
}
