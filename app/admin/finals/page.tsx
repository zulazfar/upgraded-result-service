'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Zap, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface Category { category_id: number; category_name: string }
interface FinalsClimber { climber_id: string; name: string; organisation: string; category: string; gender: string; qualifying_rank: number }
type SortState = { col: string; dir: 'asc' | 'desc' }

function toggleSort(cur: SortState, col: string): SortState {
  if (cur.col === col) return { col, dir: cur.dir === 'asc' ? 'desc' : 'asc' }
  return { col, dir: 'asc' }
}

function SortTh({ col, label, sort, onSort, className }: {
  col: string; label: string; sort: SortState; onSort: (c: string) => void; className?: string
}) {
  const active = sort.col === col
  const Icon = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown
  return (
    <TableHead className={className}>
      <button type="button" onClick={() => onSort(col)}
        className="flex items-center gap-1 font-semibold transition-colors hover:text-foreground"
        style={{ color: active ? 'var(--field-text)' : undefined }}>
        {label}<Icon className="w-3 h-3 opacity-60" strokeWidth={2} />
      </button>
    </TableHead>
  )
}

const PODIUM = ['🥇', '🥈', '🥉']

export default function FinalsAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [climbers, setClimbers] = useState<FinalsClimber[]>([])
  const [loadingClimbers, setLoadingClimbers] = useState(true)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)
  const [promoteCategory, setPromoteCategory] = useState('')
  const [promoting, setPromoting] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [sort, setSort] = useState<SortState>({ col: 'qualifying_rank', dir: 'asc' })
  const [categoryTab, setCategoryTab] = useState<string>('')
  const [removeTarget, setRemoveTarget] = useState<FinalsClimber | null>(null)
  const [removing, setRemoving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewAthletes, setPreviewAthletes] = useState<{ climber_name?: string; team_name?: string; total_points: number; total_tops: number }[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  async function load() {
    setLoadingClimbers(true)
    setLoadingLeaderboard(true)
    const [cats, cl, lb] = await Promise.all([
      fetch('/api/admin/categories').then(r => r.json()),
      fetch('/api/finals/climbers').then(r => r.json()),
      fetch('/api/finals/leaderboard').then(r => r.json()),
    ])
    setCategories(cats); setClimbers(cl); setLeaderboard(lb)
    setLoadingClimbers(false); setLoadingLeaderboard(false)
  }
  useEffect(() => { load() }, [])

  async function openPromotePreview() {
    if (!promoteCategory) { toast.error('Select a category first.'); return }
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/results/category/${promoteCategory}`)
      const data = await res.json()
      setPreviewAthletes((data.results ?? []).slice(0, 8))
      setPreviewOpen(true)
    } finally { setPreviewLoading(false) }
  }

  async function handlePromote() {
    setPromoting(true)
    try {
      const res = await fetch(`/api/finals/promote/${promoteCategory}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success(data.message); setPreviewOpen(false); load()
    } finally { setPromoting(false) }
  }

  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/finals/climbers/${removeTarget.climber_id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success('Removed.'); setRemoveTarget(null); load()
    } finally { setRemoving(false) }
  }

  const selectedCategoryName = categories.find(c => String(c.category_id) === promoteCategory)?.category_name

  // Derive unique promoted categories from the climbers list
  const promotedCategories = [...new Set(climbers.map(c => c.category))].sort()

  const sortedClimbers = [...climbers].sort((a, b) => {
    const av = (a as any)[sort.col] ?? ''
    const bv = (b as any)[sort.col] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sort.dir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
          style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>Admin</p>
        <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>Finals</h1>
      </div>

      <Tabs defaultValue="climbers">
        <TabsList>
          <TabsTrigger value="climbers">Finalists</TabsTrigger>
          <TabsTrigger value="leaderboard">Finals Results</TabsTrigger>
        </TabsList>

        {/* ── Finalists tab ──────────────────────────────────────────── */}
        <TabsContent value="climbers" className="space-y-5 mt-4">

          {/* Promote card */}
          <div className="p-5 rounded-2xl" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
              Promote from Qualifiers
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--field-muted)' }}>
              Select a category to auto-promote the top 8 ranked athletes into finals.
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: 'var(--field-text)' }}>Category</label>
                <Select value={promoteCategory} onValueChange={v => setPromoteCategory(v ?? '')}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Select…">
                      {selectedCategoryName ?? <span className="text-muted-foreground">Select…</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold opacity-0 select-none">Go</label>
                <button
                  onClick={openPromotePreview}
                  disabled={!promoteCategory || previewLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold"
                  style={{
                    background: 'var(--field-orange)', color: '#fff', border: 'none',
                    cursor: (!promoteCategory || previewLoading) ? 'not-allowed' : 'pointer',
                    opacity: (!promoteCategory || previewLoading) ? 0.6 : 1,
                    boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                  }}>
                  {previewLoading ? 'Loading…' : 'Promote Top 8'}
                </button>
              </div>
            </div>
          </div>

          {/* Category tabs — shown once at least one category has been promoted */}
          {!loadingClimbers && promotedCategories.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setCategoryTab('')}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: !categoryTab ? 'var(--field-orange)' : 'var(--field-raised)',
                  color: !categoryTab ? '#fff' : 'var(--field-muted)',
                  border: 'none', cursor: 'pointer',
                }}>
                All ({climbers.length})
              </button>
              {promotedCategories.map(cat => {
                const count = climbers.filter(c => c.category === cat).length
                return (
                  <button key={cat}
                    onClick={() => setCategoryTab(cat)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                    style={{
                      background: categoryTab === cat ? 'var(--field-orange)' : 'var(--field-raised)',
                      color: categoryTab === cat ? '#fff' : 'var(--field-muted)',
                      border: 'none', cursor: 'pointer',
                    }}>
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* Count */}
          <div className="flex justify-end">
            <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--field-muted)' }}>
              {loadingClimbers ? '—' : (() => {
                const visible = categoryTab ? climbers.filter(c => c.category === categoryTab).length : climbers.length
                return `${visible} finalist${visible !== 1 ? 's' : ''}${categoryTab ? ` in ${categoryTab}` : ''}`
              })()}
            </span>
          </div>

          {/* Finalists table */}
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ background: 'var(--field-raised)' }}>
                  <TableHead>ID</TableHead>
                  <SortTh col="name" label="Name" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
                  {!categoryTab && <SortTh col="category" label="Category" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />}
                  <SortTh col="gender" label="Gender" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
                  <SortTh col="qualifying_rank" label="Q.Rank" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              {loadingClimbers ? (
                <TableSkeleton columns={6} rows={5} />
              ) : (
                <TableBody>
                  {sortedClimbers.filter(c => !categoryTab || c.category === categoryTab).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--field-raised)' }}>
                            <Zap className="w-5 h-5" strokeWidth={1.5} style={{ color: 'var(--field-muted)' }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--field-text)' }}>No finalists yet</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--field-muted)' }}>Select a category above and promote the top 8 from qualifiers</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {sortedClimbers.filter(c => !categoryTab || c.category === categoryTab).map(c => (
                    <TableRow key={c.climber_id} className="hover:bg-[var(--field-raised)] transition-colors">
                      <TableCell className="font-mono text-xs">{c.climber_id}</TableCell>
                      <TableCell className="font-semibold">{c.name}</TableCell>
                      {!categoryTab && <TableCell style={{ color: 'var(--field-muted)' }}>{c.category}</TableCell>}
                      <TableCell style={{ color: 'var(--field-muted)' }}>{c.gender}</TableCell>
                      <TableCell className="tabular-nums font-medium">{c.qualifying_rank || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="destructive" onClick={() => setRemoveTarget(c)}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </div>
        </TabsContent>

        {/* ── Finals Results tab ─────────────────────────────────────── */}
        <TabsContent value="leaderboard" className="mt-4">
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ background: 'var(--field-raised)' }}>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Tops</TableHead>
                  <TableHead className="text-right">Zones</TableHead>
                </TableRow>
              </TableHeader>
              {loadingLeaderboard ? (
                <TableSkeleton columns={6} rows={5} />
              ) : (
                <TableBody>
                  {leaderboard.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: 'var(--field-text)' }}>No finals results yet</p>
                          <p className="text-xs" style={{ color: 'var(--field-muted)' }}>Score finals using the judge view to populate this table</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {leaderboard.map((r: any) => (
                    <TableRow key={r.climberId} className="hover:bg-[var(--field-raised)] transition-colors">
                      <TableCell className="font-bold tabular-nums">{r.rank}</TableCell>
                      <TableCell className="font-semibold">{r.name}</TableCell>
                      <TableCell><Badge variant="secondary">{r.category}</Badge></TableCell>
                      <TableCell className="text-right font-bold tabular-nums" style={{ color: 'var(--field-orange)' }}>{r.score.toFixed(1)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.topCount}</TableCell>
                      <TableCell className="text-right tabular-nums" style={{ color: 'var(--field-muted)' }}>{r.zoneCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Promote preview dialog ───────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={o => { if (!promoting) setPreviewOpen(o) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Finals — {selectedCategoryName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <p className="text-sm" style={{ color: 'var(--field-muted)' }}>
              The following {previewAthletes.length} athletes will be promoted based on qualifier standings:
            </p>
            <div className="rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-xs)' }}>
              {previewAthletes.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--field-muted)' }}>
                  No qualifier results found for this category.
                </div>
              ) : (
                previewAthletes.map((a, i) => (
                  <div key={i}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                    style={{ borderBottom: i < previewAthletes.length - 1 ? '1px solid rgba(17,24,39,0.05)' : undefined, background: i % 2 === 0 ? 'transparent' : 'rgba(17,24,39,0.015)' }}>
                    <span className="w-5 text-center shrink-0 font-bold tabular-nums text-xs" style={{ color: i < 3 ? 'var(--field-orange)' : 'var(--field-muted)' }}>
                      {i + 1}
                    </span>
                    <span className="flex-1 font-medium truncate" style={{ color: 'var(--field-text)' }}>{a.climber_name ?? a.team_name}</span>
                    <span className="tabular-nums font-bold shrink-0" style={{ color: 'var(--field-orange)', fontSize: '0.75rem' }}>{a.total_points} pts</span>
                    <span className="tabular-nums shrink-0 text-xs" style={{ color: 'var(--field-muted)' }}>{a.total_tops}T</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)} disabled={promoting}>Cancel</Button>
              <Button type="button" disabled={promoting || previewAthletes.length === 0} onClick={handlePromote}>
                {promoting ? 'Promoting…' : `Confirm & Promote ${previewAthletes.length}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Remove finalist confirm ───────────────────────────────────── */}
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={o => { if (!o) setRemoveTarget(null) }}
        title="Remove Finalist"
        description={
          removeTarget && (
            <>
              Remove <strong>{removeTarget.name}</strong> from finals?{' '}
              {removeTarget.qualifying_rank && (
                <>They qualified {removeTarget.category} in <strong>rank {removeTarget.qualifying_rank}</strong>.</>
              )}{' '}
              Their finals scores will also be deleted.
            </>
          )
        }
        confirmLabel="Remove"
        onConfirm={handleRemove}
        loading={removing}
      />
    </div>
  )
}
