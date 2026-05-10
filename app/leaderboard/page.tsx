'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Category { category_id: number; category_name: string }
interface QualResult { climber_id?: string; climber_name?: string; team_name?: string; total_points: number; total_tops: number; total_attempts: number }
interface FinalsResult { rank: number; climberId: string; name: string; category: string; score: number; topCount: number; zoneCount: number; attemptsToTop: number; attemptsToZone: number }

export default function LeaderboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [qualData, setQualData] = useState<{ category_name: string; is_team_category: boolean; results: QualResult[] } | null>(null)
  const [finalsData, setFinalsData] = useState<FinalsResult[]>([])
  const [tab, setTab] = useState('qualifiers')

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(setCategories)
    fetch('/api/finals/leaderboard').then(r => r.json()).then(setFinalsData)
  }, [])

  async function loadCategory(id: string) {
    setCategoryId(id)
    if (!id) { setQualData(null); return }
    const res = await fetch(`/api/results/category/${id}`)
    setQualData(await res.json())
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <Button variant="outline" size="sm" className="text-gray-300 border-gray-700" onClick={() => { fetch('/api/finals/leaderboard').then(r => r.json()).then(setFinalsData); if (categoryId) loadCategory(categoryId) }}>
            Refresh
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-gray-800 mb-6">
            <TabsTrigger value="qualifiers">Qualifiers</TabsTrigger>
            <TabsTrigger value="finals">Finals</TabsTrigger>
          </TabsList>

          <TabsContent value="qualifiers">
            <div className="mb-6">
              <Select value={categoryId} onValueChange={v => loadCategory(v ?? '')}>
                <SelectTrigger className="w-56 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {categories.map(c => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {qualData && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold">{qualData.category_name}</h2>
                  {qualData.is_team_category && <Badge variant="secondary">Team</Badge>}
                </div>
                <div className="rounded-lg overflow-hidden border border-gray-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400 w-14">Rank</TableHead>
                        <TableHead className="text-gray-400">{qualData.is_team_category ? 'Team' : 'Athlete'}</TableHead>
                        <TableHead className="text-gray-400 text-right">Points</TableHead>
                        <TableHead className="text-gray-400 text-right">Tops</TableHead>
                        <TableHead className="text-gray-400 text-right">Attempts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qualData.results.map((r, i) => (
                        <TableRow key={i} className={cn('border-gray-800', i < 3 && 'bg-gray-900')}>
                          <TableCell className={cn('font-bold', i === 0 && 'text-yellow-400', i === 1 && 'text-gray-300', i === 2 && 'text-amber-600')}>
                            {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : i + 1}
                          </TableCell>
                          <TableCell className="font-medium">{qualData.is_team_category ? r.team_name : r.climber_name}</TableCell>
                          <TableCell className="text-right font-mono">{r.total_points}</TableCell>
                          <TableCell className="text-right">{r.total_tops}</TableCell>
                          <TableCell className="text-right text-gray-400">{r.total_attempts}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="finals">
            {finalsData.length === 0 ? (
              <p className="text-gray-500 text-sm">No finals results yet.</p>
            ) : (
              <div className="rounded-lg overflow-hidden border border-gray-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400 w-14">Rank</TableHead>
                      <TableHead className="text-gray-400">Athlete</TableHead>
                      <TableHead className="text-gray-400">Category</TableHead>
                      <TableHead className="text-gray-400 text-right">Score</TableHead>
                      <TableHead className="text-gray-400 text-right">Tops</TableHead>
                      <TableHead className="text-gray-400 text-right">Zones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finalsData.map(r => (
                      <TableRow key={r.climberId} className={cn('border-gray-800', r.rank <= 3 && 'bg-gray-900')}>
                        <TableCell className={cn('font-bold', r.rank === 1 && 'text-yellow-400', r.rank === 2 && 'text-gray-300', r.rank === 3 && 'text-amber-600')}>
                          {r.rank === 1 ? '1st' : r.rank === 2 ? '2nd' : r.rank === 3 ? '3rd' : r.rank}
                        </TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell><Badge variant="outline" className="border-gray-600 text-gray-300">{r.category}</Badge></TableCell>
                        <TableCell className="text-right font-mono font-bold">{r.score.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{r.topCount}</TableCell>
                        <TableCell className="text-right text-gray-400">{r.zoneCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
