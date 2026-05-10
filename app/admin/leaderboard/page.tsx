'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

interface Category { category_id: number; category_name: string }
interface Result { climber_id?: string; climber_name?: string; team_name?: string; total_points: number; total_tops: number; total_attempts: number }
interface CategoryResults { category_name: string; is_team_category: boolean; results: Result[] }
interface FinalsResult { rank: number; climberId: string; name: string; category: string; score: number; topCount: number; zoneCount: number }

export default function LeaderboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [data, setData] = useState<CategoryResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [finalsData, setFinalsData] = useState<FinalsResult[]>([])
  const [finalsLoading, setFinalsLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(setCategories)
    loadFinals()
  }, [])

  async function load(id: string) {
    if (!id) return
    setLoading(true)
    const res = await fetch(`/api/results/category/${id}`)
    setData(await res.json())
    setLoading(false)
  }

  async function loadFinals() {
    setFinalsLoading(true)
    const res = await fetch('/api/finals/leaderboard')
    setFinalsData(await res.json())
    setFinalsLoading(false)
  }

  function handleExport() {
    window.open(`/api/results/export?format=xlsx&category_id=${categoryId}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <Link href="/leaderboard" target="_blank"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
          Public leaderboard
        </Link>
      </div>

      <Tabs defaultValue="qualifiers">
        <TabsList>
          <TabsTrigger value="qualifiers">Qualifiers</TabsTrigger>
          <TabsTrigger value="finals">Finals</TabsTrigger>
        </TabsList>

        {/* ── Qualifiers ──────────────────────────────────────────────── */}
        <TabsContent value="qualifiers" className="space-y-4 mt-4">
          <div className="flex gap-3 items-center flex-wrap">
            <Select value={categoryId} onValueChange={v => { const val = v ?? ''; setCategoryId(val); load(val) }}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Select category…" /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>)}</SelectContent>
            </Select>
            {data && <Button variant="outline" size="sm" onClick={handleExport}>Export Excel</Button>}
            {data && <Button variant="outline" size="sm" onClick={() => load(categoryId)}>Refresh</Button>}
          </div>

          {!categoryId && (
            <p className="text-sm text-muted-foreground py-4">Select a category to view standings.</p>
          )}

          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {data && !loading && (
            <>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{data.category_name}</h2>
                {data.is_team_category && <Badge variant="secondary">Team</Badge>}
                <span className="text-xs text-muted-foreground ml-1">({data.results.length} {data.is_team_category ? 'teams' : 'athletes'})</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>{data.is_team_category ? 'Team' : 'Athlete'}</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Tops</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.results.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">No results yet for this category.</TableCell></TableRow>
                  ) : (
                    data.results.map((r, i) => (
                      <TableRow key={i} className={i < 3 ? 'font-medium' : ''}>
                        <TableCell>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</TableCell>
                        <TableCell>{data.is_team_category ? r.team_name : r.climber_name}</TableCell>
                        <TableCell className="text-right">{r.total_points}</TableCell>
                        <TableCell className="text-right">{r.total_tops}</TableCell>
                        <TableCell className="text-right">{r.total_attempts}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </TabsContent>

        {/* ── Finals ──────────────────────────────────────────────────── */}
        <TabsContent value="finals" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={loadFinals}>Refresh</Button>
          </div>

          {finalsLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {!finalsLoading && finalsData.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No finals results yet. Score finals at <Link href="/admin/finals" className="underline">Admin → Finals</Link>.</p>
          )}

          {!finalsLoading && finalsData.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Athlete</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Tops</TableHead>
                  <TableHead className="text-right">Zones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalsData.map((r, i) => (
                  <TableRow key={r.climberId} className={r.rank <= 3 ? 'font-medium' : ''}>
                    <TableCell>{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell><Badge variant="secondary">{r.category}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{r.score.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{r.topCount}</TableCell>
                    <TableCell className="text-right">{r.zoneCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
