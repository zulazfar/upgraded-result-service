import { Nav } from '@/components/nav'
import { requireAuth } from '@/lib/auth'

const JUDGE_LINKS = [
  { href: '/judge', label: 'Score' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export default async function JudgeLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav links={JUDGE_LINKS} title="Judge" />
      <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
