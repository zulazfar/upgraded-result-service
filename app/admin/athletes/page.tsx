'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import { Upload, Plus, Search, Users, BarChart2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface Category { category_id: number; category_name: string }
interface Climber { climber_id: string; name: string; gender: string; age: number; team_name: string; categories: Category[] }
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

export default function AthletesPage() {
  const [climbers, setClimbers] = useState<Climber[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [sort, setSort] = useState<SortState>({ col: 'name', dir: 'asc' })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Climber | null>(null)
  const [form, setForm] = useState({ climber_id: '', name: '', gender: '', age: '', team_name: '', category_id: '' })
  const [ageError, setAgeError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Climber | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const [c, cats] = await Promise.all([
      fetch('/api/admin/climbers').then(r => r.json()),
      fetch('/api/admin/categories').then(r => r.json()),
    ])
    setClimbers(c); setCategories(cats); setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openAdd() {
    setEditing(null)
    setAgeError('')
    setForm({ climber_id: '', name: '', gender: '', age: '', team_name: '', category_id: '' })
    setOpen(true)
  }
  function openEdit(c: Climber) {
    setEditing(c)
    setAgeError('')
    setForm({ climber_id: c.climber_id, name: c.name, gender: c.gender || '', age: String(c.age || ''), team_name: c.team_name || '', category_id: String(c.categories[0]?.category_id || '') })
    setOpen(true)
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required.'); return }
    if (form.age) {
      const n = parseInt(form.age)
      if (isNaN(n) || n < 5 || n > 99) { setAgeError('Age must be between 5 and 99.'); return }
    }
    setSaving(true)
    try {
      const payload = { ...form, age: form.age ? parseInt(form.age) : null, category_ids: form.category_id ? [parseInt(form.category_id)] : [] }
      const url = editing ? `/api/admin/climbers/${editing.climber_id}` : '/api/admin/climbers'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success(editing ? 'Athlete updated.' : 'Athlete added.')
      setOpen(false); load()
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/climbers/${deleteTarget.climber_id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success('Athlete deleted.')
      setDeleteTarget(null); load()
    } finally { setDeleting(false) }
  }

  async function handleBulk() {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.error('Select a CSV file first.'); return }
    const fd = new FormData()
    fd.append('file', file)
    if (bulkCategoryId) fd.append('category_id', bulkCategoryId)
    const res = await fetch('/api/admin/climbers/bulk', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success(data.message); load()
    if (fileRef.current) fileRef.current.value = ''
    setFileName('')
  }

  // Filter + sort
  let filtered = climbers.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.climber_id.toLowerCase().includes(q) || (c.team_name || '').toLowerCase().includes(q)
    const matchCat = !categoryFilter || c.categories.some(cat => String(cat.category_id) === categoryFilter)
    const matchGender = !genderFilter || c.gender === genderFilter
    return matchSearch && matchCat && matchGender
  })
  filtered = [...filtered].sort((a, b) => {
    const av = (a as any)[sort.col] ?? ''
    const bv = (b as any)[sort.col] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sort.dir === 'asc' ? cmp : -cmp
  })

  const selectedCategoryName = categories.find(c => String(c.category_id) === bulkCategoryId)?.category_name
  const hasActiveFilters = !!(search || categoryFilter || genderFilter)

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>Admin</p>
          <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>Athletes</h1>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'var(--field-orange)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <Plus className="w-4 h-4" strokeWidth={2} />Add athlete
        </button>
      </div>

      {/* ── Bulk import card ─────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
        <div className="mb-4">
          <h3 className="font-bold text-base" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>Bulk Import</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--field-muted)' }}>
            CSV columns: <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">Climber ID, Name, Gender, Age, Team/Organisation</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: 'var(--field-text)' }}>
              Category <span style={{ color: 'var(--field-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <Select value={bulkCategoryId} onValueChange={v => setBulkCategoryId(v ?? '')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="None">
                  {selectedCategoryName ?? <span className="text-muted-foreground">None</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {categories.map(c => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: 'var(--field-text)' }}>CSV file</label>
            <input ref={fileRef} type="file" accept=".csv" id="csv-upload" className="sr-only"
              onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
            <label htmlFor="csv-upload"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer select-none"
              style={{ background: 'var(--field-raised)', color: fileName ? 'var(--field-text)' : 'var(--field-muted)', boxShadow: 'var(--shadow-xs)', transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: '220px', display: 'flex' }}>
              <Upload className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{fileName || 'Choose file…'}</span>
            </label>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold opacity-0 select-none">Go</label>
            <button onClick={handleBulk}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'var(--field-orange)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)', whiteSpace: 'nowrap' }}>
              Import CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" strokeWidth={1.75} style={{ color: 'var(--field-muted)' }} />
          <input placeholder="Search athletes…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-xl outline-none w-52"
            style={{ background: '#fff', boxShadow: 'var(--shadow-xs)', color: 'var(--field-text)', fontFamily: 'inherit', transition: 'box-shadow 160ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            onFocus={e => (e.target.style.boxShadow = 'var(--shadow-focus)')}
            onBlur={e => (e.target.style.boxShadow = 'var(--shadow-xs)')} />
        </div>
        <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v ?? '')}>
          <SelectTrigger className="w-44 h-[34px] text-sm rounded-xl" style={{ boxShadow: 'var(--shadow-xs)', background: '#fff' }}>
            <SelectValue placeholder="All categories">
              {categoryFilter
                ? (categories.find(c => String(c.category_id) === categoryFilter)?.category_name ?? <span className="text-muted-foreground">All categories</span>)
                : <span className="text-muted-foreground">All categories</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={v => setGenderFilter(v ?? '')}>
          <SelectTrigger className="w-32 h-[34px] text-sm rounded-xl" style={{ boxShadow: 'var(--shadow-xs)', background: '#fff' }}>
            <SelectValue placeholder="All genders">
              {genderFilter || <span className="text-muted-foreground">All genders</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All genders</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <button type="button"
            onClick={() => { setSearch(''); setCategoryFilter(''); setGenderFilter('') }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--field-muted)', background: 'var(--field-raised)' }}>
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs font-medium tabular-nums" style={{ color: 'var(--field-muted)' }}>
          {loading ? '—' : `${filtered.length}${filtered.length !== climbers.length ? ` of ${climbers.length}` : ''} athlete${climbers.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Athletes table ───────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--field-raised)' }}>
              <TableHead>ID</TableHead>
              <SortTh col="name" label="Name" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <TableHead>Gender</TableHead>
              <SortTh col="team_name" label="Team" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <TableHead>Categories</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableSkeleton columns={6} rows={6} />
          ) : (
            <TableBody>
              {filtered.length === 0 && climbers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--field-raised)' }}>
                        <Users className="w-5 h-5" strokeWidth={1.5} style={{ color: 'var(--field-muted)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--field-text)' }}>No athletes yet</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--field-muted)' }}>Add your first athlete or import a CSV file above</p>
                      </div>
                      <button onClick={openAdd}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--field-orange)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        <Plus className="w-3.5 h-3.5" strokeWidth={2} />Add athlete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filtered.length === 0 && climbers.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm" style={{ color: 'var(--field-muted)' }}>
                    No athletes match your filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(c => (
                <TableRow key={c.climber_id} className="hover:bg-[var(--field-raised)] transition-colors">
                  <TableCell className="font-mono text-xs">{c.climber_id}</TableCell>
                  <TableCell className="font-semibold">{c.name}</TableCell>
                  <TableCell>{c.gender || '—'}</TableCell>
                  <TableCell style={{ color: 'var(--field-muted)' }}>{c.team_name || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {c.categories.map(cat => <Badge key={cat.category_id} variant="secondary">{cat.category_name}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/results?q=${encodeURIComponent(c.climber_id)}`}>
                        <Button size="sm" variant="ghost" title="View scores">
                          <BarChart2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(c)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* ── Add / Edit dialog ────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={o => { if (!saving) setOpen(o) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Athlete' : 'Add Athlete'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="space-y-3 pt-1">
              {!editing && (
                <div>
                  <Label>Climber ID <span className="text-destructive">*</span></Label>
                  <Input value={form.climber_id} onChange={e => setForm(f => ({ ...f, climber_id: e.target.value }))} />
                </div>
              )}
              <div>
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Gender <span className="text-destructive">*</span></Label>
                <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v ?? '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…">
                      {form.gender || <span className="text-muted-foreground">Select…</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Age <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <Input type="number" min={5} max={99} value={form.age}
                  onChange={e => { setAgeError(''); setForm(f => ({ ...f, age: e.target.value })) }}
                  onBlur={() => {
                    if (form.age) {
                      const n = parseInt(form.age)
                      if (isNaN(n) || n < 5 || n > 99) setAgeError('Age must be between 5 and 99.')
                    }
                  }} />
                {ageError && <p className="text-xs mt-1 text-destructive">{ageError}</p>}
              </div>
              <div>
                <Label>Team / Organisation</Label>
                <Input value={form.team_name} onChange={e => setForm(f => ({ ...f, team_name: e.target.value }))} />
              </div>
              <div>
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v ?? '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="None">
                      {categories.find(c => String(c.category_id) === form.category_id)?.category_name
                        ?? <span className="text-muted-foreground">None</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map(c => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ───────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => { if (!o) setDeleteTarget(null) }}
        title="Delete Athlete"
        description={<>Permanently delete <strong>{deleteTarget?.name}</strong>? This will also remove all their recorded results. This cannot be undone.</>}
        confirmLabel="Delete Athlete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
