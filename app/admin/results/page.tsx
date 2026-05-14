'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Search, Download, BarChart2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface Category { category_id: number; category_name: string }
interface Result {
  result_id: number; climber_id: string; climber_name: string
  route_id: number; category_name: string; attempts: number
  is_top: boolean; points_awarded: number; score_type: string; timestamp: string
}
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

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sort, setSort] = useState<SortState>({ col: 'climber_name', dir: 'asc' })
  const [editing, setEditing] = useState<Result | null>(null)
  const [form, setForm] = useState({ score_type: 'attempt', attempts: '1' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Result | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    const [res, cats] = await Promise.all([
      fetch('/api/admin/results').then(r => r.json()),
      fetch('/api/admin/categories').then(r => r.json()),
    ])
    setResults(res); setCategories(cats); setLoading(false)
  }
  useEffect(() => { load() }, [])

  // D1 — read ?q= from URL to pre-filter for a specific athlete
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) setSearch(q)
  }, [])

  function openEdit(r: Result) { setEditing(r); setForm({ score_type: r.score_type, attempts: String(r.attempts) }) }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/results/${editing!.result_id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score_type: form.score_type, attempts: parseInt(form.attempts) })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success(`Result updated. Points: ${data.points_awarded}`)
      setEditing(null); load()
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/results/${deleteTarget.result_id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success('Result deleted.')
      setDeleteTarget(null); load()
    } finally { setDeleting(false) }
  }

  function handleExport(format: 'csv' | 'xlsx') {
    window.open(`/api/results/export?format=${format}`, '_blank')
  }

  // Filter + sort
  let filtered = results.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.climber_name.toLowerCase().includes(q) || r.climber_id.toLowerCase().includes(q)
    const matchCat = !categoryFilter || r.category_name === categoryFilter
    const matchType = !typeFilter || r.score_type === typeFilter
    return matchSearch && matchCat && matchType
  })
  filtered = [...filtered].sort((a, b) => {
    const av = (a as any)[sort.col] ?? ''
    const bv = (b as any)[sort.col] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sort.dir === 'asc' ? cmp : -cmp
  })

  const hasActiveFilters = !!(search || categoryFilter || typeFilter)
  const selectedCategoryForFilter = categories.find(c => c.category_name === categoryFilter)?.category_name

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>Admin</p>
          <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>Score Log</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--field-raised)', color: 'var(--field-text)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-xs)', transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <Download className="w-4 h-4" strokeWidth={1.75} />CSV
          </button>
          <button onClick={() => handleExport('xlsx')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--field-raised)', color: 'var(--field-text)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-xs)', transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <Download className="w-4 h-4" strokeWidth={1.75} />Excel
          </button>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Category is the primary filter — shown first */}
        <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v ?? '')}>
          <SelectTrigger className="w-48 h-[34px] text-sm rounded-xl" style={{ boxShadow: 'var(--shadow-xs)', background: '#fff' }}>
            <SelectValue placeholder="All categories">
              {categoryFilter || <span className="text-muted-foreground">All categories</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c.category_id} value={c.category_name}>{c.category_name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={v => setTypeFilter(v ?? '')}>
          <SelectTrigger className="w-32 h-[34px] text-sm rounded-xl" style={{ boxShadow: 'var(--shadow-xs)', background: '#fff' }}>
            <SelectValue placeholder="All types">
              {typeFilter || <span className="text-muted-foreground">All types</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="attempt">Attempt</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" strokeWidth={1.75} style={{ color: 'var(--field-muted)' }} />
          <input placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-xl outline-none w-52"
            style={{ background: '#fff', boxShadow: 'var(--shadow-xs)', color: 'var(--field-text)', fontFamily: 'inherit', transition: 'box-shadow 160ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            onFocus={e => (e.target.style.boxShadow = 'var(--shadow-focus)')}
            onBlur={e => (e.target.style.boxShadow = 'var(--shadow-xs)')} />
        </div>

        {hasActiveFilters && (
          <button type="button"
            onClick={() => { setSearch(''); setCategoryFilter(''); setTypeFilter('') }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--field-muted)', background: 'var(--field-raised)' }}>
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs font-medium tabular-nums" style={{ color: 'var(--field-muted)' }}>
          {loading ? '—' : `${filtered.length}${filtered.length !== results.length ? ` of ${results.length}` : ''} result${results.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Results table ────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--field-raised)' }}>
              <SortTh col="climber_name" label="Climber" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <SortTh col="route_id" label="Route" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <SortTh col="category_name" label="Category" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <SortTh col="score_type" label="Type" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <SortTh col="attempts" label="Attempts" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <SortTh col="points_awarded" label="Points" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableSkeleton columns={7} rows={8} />
          ) : (
            <TableBody>
              {filtered.length === 0 && results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--field-raised)' }}>
                        <BarChart2 className="w-5 h-5" strokeWidth={1.5} style={{ color: 'var(--field-muted)' }} />
                      </div>
                      <p className="text-sm font-semibold mt-1" style={{ color: 'var(--field-text)' }}>No results yet</p>
                      <p className="text-xs" style={{ color: 'var(--field-muted)' }}>Scores will appear here once judges start recording attempts</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filtered.length === 0 && results.length > 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm" style={{ color: 'var(--field-muted)' }}>
                    No results match your filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(r => (
                <TableRow key={r.result_id} className="hover:bg-[var(--field-raised)] transition-colors">
                  <TableCell>
                    <div className="font-semibold">{r.climber_name}</div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--field-muted)' }}>{r.climber_id}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">{r.route_id}</TableCell>
                  <TableCell style={{ color: 'var(--field-muted)' }}>{r.category_name}</TableCell>
                  <TableCell>
                    <Badge variant={r.is_top ? 'default' : 'secondary'}>{r.score_type}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{r.attempts}</TableCell>
                  <TableCell className="font-bold tabular-nums" style={{ color: 'var(--field-orange)' }}>{r.points_awarded}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(r)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* ── Edit dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!editing} onOpenChange={open => { if (!saving && !open) setEditing(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Result — {editing?.climber_name} / Route {editing?.route_id}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="space-y-3 pt-1">
              <div>
                <Label>Score Type</Label>
                <Select value={form.score_type} onValueChange={v => setForm(f => ({ ...f, score_type: v ?? 'attempt' }))}>
                  <SelectTrigger>
                    <SelectValue>{form.score_type === 'top' ? 'Top' : 'Attempt'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="attempt">Attempt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Attempts</Label>
                <Input type="number" min={1} value={form.attempts}
                  onChange={e => setForm(f => ({ ...f, attempts: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Update'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => { if (!o) setDeleteTarget(null) }}
        title="Delete Result"
        description={<>Permanently delete this result for <strong>{deleteTarget?.climber_name}</strong> on Route {deleteTarget?.route_id}? This cannot be undone.</>}
        confirmLabel="Delete Result"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
