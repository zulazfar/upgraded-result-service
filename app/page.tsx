import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function Home() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/login')
  if (session.isSuperAdmin) redirect('/admin')
  redirect('/judge')
}
