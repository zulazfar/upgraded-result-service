'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ExternalLink, RefreshCw } from 'lucide-react'

interface Category { category_id: number; category_name: string }
interface Result { climber_id?: string; climber_name?: string; team_name?: string; total_points: number; total_tops: number; total_attempts: number }
interface CategoryResults { category_name: string; is_team_category: boolean; results: Result[] }
interface FinalsResult { rank: number; climberId: string; name: string; category: string; score: number; topCount: number; zoneCount: number }

const PODIUM = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [overview, setOverview] = useState<Record<number, CategoryResults>>({})
  const [overviewLoading, setOverviewLoading] = useState(false)

  // Detail section
  const [detailId, setDetailId] = useState('')
  const [detail, setDetail] = useState<CategoryResults | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  // Finals
  const [finalsData, setFinalsData] = useState<FinalsResult[]>([])
  const [finalsLoading, setFinalsLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then((cats: Category[]) => {
        setCategories(cats)
        loadOverview(cats)
      })
    loadFinals()
  }, [])

  async function loadOverview(cats: Category[]) {
    setOverviewLoading(true)
    const entries = await Promise.all(
      cats.map(c =>
        fetch(`/api/results/category/${c.category_id}`)
          .then(r => r.json())
          .then((d: CategoryResults) => [c.category_id, d] as const)
      )
    )
    setOverview(Object.fromEntries(entries))
    setOverviewLoading(false)
  }

  async function loadDetail(id: string) {
    if (!id) return
    setDetailId(id); setDetailLoading(true)
    const res = await fetch(`/api/results/category/${id}`)
    setDetail(await res.json())
    setDetailLoading(false)
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  async function loadFinals() {
    setFinalsLoading(true)
    const res = await fetch('/api/finals/leaderboard')
    setFinalsData(await res.json())
    setFinalsLoading(false)
  }

  function handleRefresh() {
    loadOverview(categories)
    if (detailId) loadDetail(detailId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-3xl font-bold tracking-wide uppercase" style={{ letterSpacing: '0.08em', fontFamily: 'var(--font-heading, "Barlow Condensed", sans-serif)' }}>Leaderboard</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link href="/leaderboard" target="_blank" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Public view
          </Link>
        </div>
      </div>

      <Tabs defaultValue="qualifiers">
        <TabsList>
          <TabsTrigger value="qualifiers">Qualifiers</TabsTrigger>
          <TabsTrigger value="finals">Finals</TabsTrigger>
        </TabsList>

        {/* ── QUALIFIERS ─────────────────────────────────────────────── */}
        <TabsContent value="qualifiers" className="space-y-8 mt-4">

          {/* Overview grid */}
          {overviewLoading && <p className="text-sm text-muted-foreground">Loading standings…</p>}

          {!overviewLoading && categories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {categories.map(cat => {
                const d = overview[cat.category_id]
                const top8 = d?.results?.slice(0, 8) ?? []
                return (
                  <div key={cat.category_id} className="border rounded-lg overflow-hidden flex flex-col">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{cat.category_name}</span>
                        {d?.is_team_category && <Badge variant="secondary" className="text-xs">Team</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{d?.results?.length ?? 0} total</span>
                    </div>

                    {/* Standings */}
                    <div className="flex-1">
                      {!d && <p className="text-xs text-muted-foreground px-4 py-3">No results yet.</p>}
                      {top8.length === 0 && d && <p className="text-xs text-muted-foreground px-4 py-3">No results yet.</p>}
                      {top8.map((r, i) => (
                        <div key={i}
                          className="flex items-center gap-3 px-4 py-2 border-b last:border-b-0 text-sm"
                          style={{
                            background: i === 0 ? 'oklch(0.98 0.04 85)' : i === 1 ? 'oklch(0.98 0.01 0)' : i === 2 ? 'oklch(0.98 0.03 55)' : undefined,
                          }}>
                          {/* Rank */}
                          <span className="w-6 text-center shrink-0 font-bold">
                            {i < 3 ? PODIUM[i] : <span className="text-muted-foreground text-xs">{i + 1}</span>}
                          </span>
                          {/* Name */}
                          <span className="flex-1 font-medium truncate">
                            {d.is_team_category ? r.team_name : r.climber_name}
                          </span>
                          {/* Points */}
                          <span className={`font-mono text-sm font-bold shrink-0 ${i < 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {r.total_points}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                            {r.total_tops}T / {r.total_attempts}A
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer link */}
                    <button
                      onClick={() => loadDetail(String(cat.category_id))}
                      className="w-full text-xs text-center py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors border-t"
                    >
                      Full results ({d?.results?.length ?? 0}) →
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Full detail section */}
          <div ref={detailRef}>
            {(detailId || detail) && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="font-semibold text-base">Full Results</h2>
                  <div className="flex gap-2 items-center">
                    <Select value={detailId} onValueChange={v => loadDetail(v ?? '')}>
                      <SelectTrigger className="w-52"><SelectValue placeholder="Select category…" /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>)}</SelectContent>
                    </Select>
                    {detail && (
                      <Button variant="outline" size="sm"
                        onClick={() => window.open(`/api/results/export?format=xlsx&category_id=${detailId}`, '_blank')}>
                        Export Excel
                      </Button>
                    )}
                  </div>
                </div>

                {detailLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

                {detail && !detailLoading && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{detail.category_name}</span>
                      {detail.is_team_category && <Badge variant="secondary">Team</Badge>}
                      <span className="text-xs text-muted-foreground">({detail.results.length} {detail.is_team_category ? 'teams' : 'athletes'})</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Rank</TableHead>
                          <TableHead>{detail.is_team_category ? 'Team' : 'Athlete'}</TableHead>
                          <TableHead className="text-right">Points</TableHead>
                          <TableHead className="text-right">Tops</TableHead>
                          <TableHead className="text-right">Attempts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.results.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">No results yet.</TableCell></TableRow>
                        ) : (
                          detail.results.map((r, i) => (
                            <TableRow key={i} className={i < 3 ? 'font-medium' : ''}>
                              <TableCell>{i < 3 ? PODIUM[i] : i + 1}</TableCell>
                              <TableCell>{detail.is_team_category ? r.team_name : r.climber_name}</TableCell>
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
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── FINALS ──────────────────────────────────────────────────── */}
        <TabsContent value="finals" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={loadFinals}>Refresh</Button>
          </div>

          {finalsLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {!finalsLoading && finalsData.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              No finals results yet. Score finals at <Link href="/admin/finals" className="underline">Admin → Finals</Link>.
            </p>
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
                {finalsData.map(r => (
                  <TableRow key={r.climberId} className={r.rank <= 3 ? 'font-medium' : ''}>
                    <TableCell>{r.rank <= 3 ? PODIUM[r.rank - 1] : r.rank}</TableCell>
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
