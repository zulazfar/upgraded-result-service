import { getSession } from './session'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/login')
  return session
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/login')
  if (!session.isSuperAdmin) redirect('/judge')
  return session
}
