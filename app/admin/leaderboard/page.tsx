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

  const [detailId, setDetailId] = useState('')
  const [detail, setDetail] = useState<CategoryResults | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

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

  const selectedDetailName = categories.find(c => String(c.category_id) === detailId)?.category_name

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>
            Admin
          </p>
          <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>
            Leaderboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl"
            style={{
              background: 'var(--field-raised)',
              color: 'var(--field-muted)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
            Refresh
          </button>
          <Link
            href="/leaderboard"
            target="_blank"
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl"
            style={{
              background: 'var(--field-raised)',
              color: 'var(--field-muted)',
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
            Public view
          </Link>
        </div>
      </div>

      <Tabs defaultValue="qualifiers">
        <TabsList>
          <TabsTrigger value="qualifiers">Qualifiers</TabsTrigger>
          <TabsTrigger value="finals">Finals</TabsTrigger>
        </TabsList>

        {/* ── QUALIFIERS ─────────────────────────────────────────────── */}
        <TabsContent value="qualifiers" className="space-y-6 mt-4">

          {overviewLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="px-4 py-3" style={{ background: 'var(--field-raised)' }}>
                    <div className="h-3.5 w-32 rounded-md" style={{ background: 'var(--field-border)', animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
                  </div>
                  {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(17,24,39,0.04)' }}>
                      <div className="w-4 h-3 rounded" style={{ background: 'var(--field-raised)', animation: `pulse 1.5s ease-in-out ${(i + j) * 0.07}s infinite` }} />
                      <div className="h-3 flex-1 rounded-md" style={{ background: 'var(--field-raised)', width: '60%', animation: `pulse 1.5s ease-in-out ${(i + j) * 0.06}s infinite` }} />
                      <div className="h-3 w-8 rounded-md" style={{ background: 'var(--field-raised)', animation: `pulse 1.5s ease-in-out ${(i + j) * 0.05}s infinite` }} />
                    </div>
                  ))}
                </div>
              ))}
              <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
            </div>
          )}

          {!overviewLoading && categories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {categories.map(cat => {
                const d = overview[cat.category_id]
                const top8 = d?.results?.slice(0, 8) ?? []
                return (
                  <div key={cat.category_id} className="rounded-2xl overflow-hidden flex flex-col"
                    style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ background: 'var(--field-raised)', borderBottom: '1px solid rgba(17,24,39,0.05)' }}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: 'var(--field-text)' }}>{cat.category_name}</span>
                        {d?.is_team_category && <Badge variant="secondary" className="text-xs">Team</Badge>}
                      </div>
                      <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--field-muted)' }}>{d?.results?.length ?? 0} total</span>
                    </div>

                    {/* Standings */}
                    <div className="flex-1">
                      {(!d || top8.length === 0) && (
                        <p className="text-xs px-4 py-4" style={{ color: 'var(--field-muted)' }}>No results yet.</p>
                      )}
                      {top8.map((r, i) => (
                        <div key={i}
                          className="flex items-center gap-3 px-4 py-2 text-sm"
                          style={{
                            borderBottom: '1px solid rgba(17,24,39,0.04)',
                            background: i === 0 ? 'oklch(0.98 0.04 85)' : i === 1 ? 'oklch(0.98 0.01 0)' : i === 2 ? 'oklch(0.98 0.03 55)' : undefined,
                          }}>
                          <span className="w-6 text-center shrink-0 font-bold">
                            {i < 3 ? PODIUM[i] : <span className="tabular-nums" style={{ color: 'var(--field-muted)', fontSize: '0.75rem' }}>{i + 1}</span>}
                          </span>
                          <span className="flex-1 font-medium truncate" style={{ color: 'var(--field-text)' }}>
                            {d.is_team_category ? r.team_name : r.climber_name}
                          </span>
                          <span className="font-bold tabular-nums shrink-0" style={{ color: i < 3 ? 'var(--field-orange)' : 'var(--field-text)' }}>
                            {r.total_points}
                          </span>
                          <span className="text-xs tabular-nums shrink-0 w-14 text-right" style={{ color: 'var(--field-muted)' }}>
                            {r.total_tops}T / {r.total_attempts}A
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <button
                      onClick={() => loadDetail(String(cat.category_id))}
                      className="w-full text-xs font-semibold text-center py-2.5"
                      style={{
                        color: 'var(--field-muted)',
                        background: 'transparent',
                        border: 'none',
                        borderTop: '1px solid rgba(17,24,39,0.05)',
                        cursor: 'pointer',
                        transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--field-orange)'; e.currentTarget.style.background = 'var(--field-raised)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--field-muted)'; e.currentTarget.style.background = 'transparent' }}>
                      Full results ({d?.results?.length ?? 0}) →
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Full detail section — always visible */}
          <div ref={detailRef}>
            <div className="p-5 rounded-2xl space-y-4" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="font-bold text-base" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
                    Full Results
                  </h2>
                  <div className="flex gap-2 items-center">
                    <Select value={detailId} onValueChange={v => loadDetail(v ?? '')}>
                      <SelectTrigger className="w-52">
                        <SelectValue placeholder="Select category…">
                          {selectedDetailName ?? <span className="text-muted-foreground">Select category…</span>}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.category_id} value={String(c.category_id)}>
                            {c.category_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {detail && (
                      <Button variant="outline" size="sm"
                        onClick={() => window.open(`/api/results/export?format=xlsx&category_id=${detailId}`, '_blank')}>
                        Export Excel
                      </Button>
                    )}
                  </div>
                </div>

                {/* D5 — empty state when no category selected yet */}
                {!detailId && !detailLoading && (
                  <div className="py-12 text-center rounded-xl" style={{ background: 'var(--field-raised)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--field-text)' }}>Select a category to view full standings</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--field-muted)' }}>Use the dropdown above or click "Full results" on any category card</p>
                  </div>
                )}

                {detailLoading && (
                  <div className="space-y-2 py-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="h-3.5 rounded-md" style={{ background: 'var(--field-raised)', width: `${55 + (i * 7) % 30}%`, animation: `pulse 1.5s ease-in-out ${i * 0.08}s infinite` }} />
                    ))}
                  </div>
                )}

                {detail && !detailLoading && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base" style={{ color: 'var(--field-text)' }}>{detail.category_name}</span>
                      {detail.is_team_category && <Badge variant="secondary">Team</Badge>}
                      <span className="text-xs font-medium" style={{ color: 'var(--field-muted)' }}>
                        ({detail.results.length} {detail.is_team_category ? 'teams' : 'athletes'})
                      </span>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-xs)' }}>
                      <Table>
                        <TableHeader>
                          <TableRow style={{ background: 'var(--field-raised)' }}>
                            <TableHead className="w-12">Rank</TableHead>
                            <TableHead>{detail.is_team_category ? 'Team' : 'Athlete'}</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            <TableHead className="text-right">Tops</TableHead>
                            <TableHead className="text-right">Attempts</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.results.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-sm" style={{ color: 'var(--field-muted)' }}>
                                No results yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            detail.results.map((r, i) => (
                              <TableRow key={i} className="hover:bg-[var(--field-raised)] transition-colors">
                                <TableCell className="font-bold">
                                  {i < 3 ? PODIUM[i] : <span className="tabular-nums text-sm" style={{ color: 'var(--field-muted)' }}>{i + 1}</span>}
                                </TableCell>
                                <TableCell className="font-semibold">{detail.is_team_category ? r.team_name : r.climber_name}</TableCell>
                                <TableCell className="text-right font-bold tabular-nums" style={{ color: i < 3 ? 'var(--field-orange)' : 'var(--field-text)' }}>{r.total_points}</TableCell>
                                <TableCell className="text-right tabular-nums">{r.total_tops}</TableCell>
                                <TableCell className="text-right tabular-nums" style={{ color: 'var(--field-muted)' }}>{r.total_attempts}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
            </div>
          </div>
        </TabsContent>

        {/* ── FINALS ──────────────────────────────────────────────────── */}
        <TabsContent value="finals" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <button
              onClick={loadFinals}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl"
              style={{
                background: 'var(--field-raised)',
                color: 'var(--field-muted)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
              Refresh
            </button>
          </div>

          {finalsLoading && (
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="px-6 py-3" style={{ background: 'var(--field-raised)' }}>
                <div className="h-3.5 w-40 rounded-md" style={{ background: 'var(--field-border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5" style={{ borderBottom: '1px solid rgba(17,24,39,0.04)', animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }}>
                  <div className="h-3 w-4 rounded" style={{ background: 'var(--field-raised)' }} />
                  <div className="h-3 flex-1 max-w-[180px] rounded-md" style={{ background: 'var(--field-raised)' }} />
                  <div className="h-3 w-24 rounded-md" style={{ background: 'var(--field-raised)' }} />
                  <div className="h-3 w-12 rounded-md ml-auto" style={{ background: 'var(--field-raised)' }} />
                </div>
              ))}
            </div>
          )}

          {!finalsLoading && finalsData.length === 0 && (
            <div className="text-center py-16 rounded-2xl" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--field-muted)' }}>
                No finals results yet. Score finals at{' '}
                <Link href="/admin/finals" className="underline" style={{ color: 'var(--field-orange)' }}>Admin → Finals</Link>.
              </p>
            </div>
          )}

          {!finalsLoading && finalsData.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ background: 'var(--field-raised)' }}>
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
                    <TableRow key={r.climberId}>
                      <TableCell className="font-bold">
                        {r.rank <= 3 ? PODIUM[r.rank - 1] : <span className="tabular-nums text-sm" style={{ color: 'var(--field-muted)' }}>{r.rank}</span>}
                      </TableCell>
                      <TableCell className="font-semibold">{r.name}</TableCell>
                      <TableCell><Badge variant="secondary">{r.category}</Badge></TableCell>
                      <TableCell className="text-right font-bold tabular-nums" style={{ color: r.rank <= 3 ? 'var(--field-orange)' : 'var(--field-text)' }}>{r.score.toFixed(1)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.topCount}</TableCell>
                      <TableCell className="text-right tabular-nums" style={{ color: 'var(--field-muted)' }}>{r.zoneCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
