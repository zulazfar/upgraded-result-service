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
  const [removeTarget, setRemoveTarget] = useState<FinalsClimber | null>(null)
  const [removing, setRemoving] = useState(false)

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

  async function handlePromote() {
    if (!promoteCategory) { toast.error('Select a category first.'); return }
    setPromoting(true)
    try {
      const res = await fetch(`/api/finals/promote/${promoteCategory}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success(data.message); load()
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
                  onClick={handlePromote}
                  disabled={!promoteCategory || promoting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold"
                  style={{
                    background: 'var(--field-orange)', color: '#fff', border: 'none',
                    cursor: (!promoteCategory || promoting) ? 'not-allowed' : 'pointer',
                    opacity: (!promoteCategory || promoting) ? 0.6 : 1,
                    boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                  }}>
                  {promoting ? 'Promoting…' : 'Promote Top 8'}
                </button>
              </div>
            </div>
          </div>

          {/* Count */}
          <div className="flex justify-end">
            <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--field-muted)' }}>
              {loadingClimbers ? '—' : `${climbers.length} finalist${climbers.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Finalists table */}
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ background: 'var(--field-raised)' }}>
                  <TableHead>ID</TableHead>
                  <SortTh col="name" label="Name" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
                  <SortTh col="category" label="Category" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
                  <SortTh col="gender" label="Gender" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
                  <SortTh col="qualifying_rank" label="Q.Rank" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              {loadingClimbers ? (
                <TableSkeleton columns={6} rows={5} />
              ) : (
                <TableBody>
                  {sortedClimbers.length === 0 && (
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
                  {sortedClimbers.map(c => (
                    <TableRow key={c.climber_id} className="hover:bg-[var(--field-raised)] transition-colors">
                      <TableCell className="font-mono text-xs">{c.climber_id}</TableCell>
                      <TableCell className="font-semibold">{c.name}</TableCell>
                      <TableCell style={{ color: 'var(--field-muted)' }}>{c.category}</TableCell>
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
