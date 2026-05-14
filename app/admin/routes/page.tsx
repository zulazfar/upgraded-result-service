'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Upload, Plus, Search, MapPin, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface Route { route_id: number; route_name: string; difficulty_points: number; result_count: number }
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

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortState>({ col: 'route_id', dir: 'asc' })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Route | null>(null)
  const [form, setForm] = useState({ route_id: '', route_name: '', difficulty_points: '' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Route | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const data = await fetch('/api/admin/routes').then(r => r.json())
    setRoutes(data); setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openAdd() { setEditing(null); setForm({ route_id: '', route_name: '', difficulty_points: '' }); setOpen(true) }
  function openEdit(r: Route) { setEditing(r); setForm({ route_id: String(r.route_id), route_name: r.route_name || '', difficulty_points: String(r.difficulty_points) }); setOpen(true) }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault()
    setSaving(true)
    try {
      const payload = { route_id: parseInt(form.route_id), route_name: form.route_name || null, difficulty_points: parseInt(form.difficulty_points) }
      const url = editing ? `/api/admin/routes/${editing.route_id}` : '/api/admin/routes'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success(editing ? 'Route updated.' : 'Route added.')
      setOpen(false); load()
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/routes/${deleteTarget.route_id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success('Route deleted.')
      setDeleteTarget(null); load()
    } finally { setDeleting(false) }
  }

  async function handleBulk() {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.error('Select a CSV file.'); return }
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/admin/routes/bulk', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success(data.message); load()
    if (fileRef.current) fileRef.current.value = ''
    setFileName('')
  }

  // Filter + sort
  let filtered = routes.filter(r => {
    const q = search.toLowerCase()
    return !q || String(r.route_id).includes(q) || (r.route_name || '').toLowerCase().includes(q)
  })
  filtered = [...filtered].sort((a, b) => {
    const av = (a as any)[sort.col] ?? ''
    const bv = (b as any)[sort.col] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sort.dir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>Admin</p>
          <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>Routes</h1>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'var(--field-orange)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <Plus className="w-4 h-4" strokeWidth={2} />Add Route
        </button>
      </div>

      {/* ── Bulk import card ─────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
        <div className="mb-4">
          <h3 className="font-bold text-base" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>Bulk Import</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--field-muted)' }}>
            CSV columns: <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">Route ID, Route Name, Points</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: 'var(--field-text)' }}>CSV file</label>
            <input ref={fileRef} type="file" accept=".csv" id="csv-upload-routes" className="sr-only"
              onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
            <label htmlFor="csv-upload-routes"
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

      {/* ── Search + count ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" strokeWidth={1.75} style={{ color: 'var(--field-muted)' }} />
          <input placeholder="Search routes…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-xl outline-none w-52"
            style={{ background: '#fff', boxShadow: 'var(--shadow-xs)', color: 'var(--field-text)', fontFamily: 'inherit', transition: 'box-shadow 160ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            onFocus={e => (e.target.style.boxShadow = 'var(--shadow-focus)')}
            onBlur={e => (e.target.style.boxShadow = 'var(--shadow-xs)')} />
        </div>
        <span className="ml-auto text-xs font-medium tabular-nums" style={{ color: 'var(--field-muted)' }}>
          {loading ? '—' : `${filtered.length}${filtered.length !== routes.length ? ` of ${routes.length}` : ''} route${routes.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Routes table ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--field-raised)' }}>
              <SortTh col="route_id" label="ID" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <SortTh col="route_name" label="Name" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <SortTh col="difficulty_points" label="Points" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <TableHead>Scores</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableSkeleton columns={5} rows={6} />
          ) : (
            <TableBody>
              {filtered.length === 0 && routes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--field-raised)' }}>
                        <MapPin className="w-5 h-5" strokeWidth={1.5} style={{ color: 'var(--field-muted)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--field-text)' }}>No routes yet</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--field-muted)' }}>Add your first route or import a CSV file above</p>
                      </div>
                      <button onClick={openAdd}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--field-orange)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        <Plus className="w-3.5 h-3.5" strokeWidth={2} />Add route
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filtered.length === 0 && routes.length > 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm" style={{ color: 'var(--field-muted)' }}>
                    No routes match your search.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(r => (
                <TableRow key={r.route_id} className="hover:bg-[var(--field-raised)] transition-colors">
                  <TableCell className="font-mono text-xs">{r.route_id}</TableCell>
                  <TableCell className="font-semibold">{r.route_name || '—'}</TableCell>
                  <TableCell className="tabular-nums font-medium" style={{ color: 'var(--field-orange)' }}>{r.difficulty_points}</TableCell>
                  <TableCell className="tabular-nums text-sm" style={{ color: 'var(--field-muted)' }}>{r.result_count ?? 0}</TableCell>
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

      {/* ── Add / Edit dialog ─────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={o => { if (!saving) setOpen(o) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Route' : 'Add Route'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="space-y-3 pt-1">
              {!editing && (
                <div>
                  <Label>Route ID <span className="text-destructive">*</span></Label>
                  <Input type="number" value={form.route_id} onChange={e => setForm(f => ({ ...f, route_id: e.target.value }))} />
                </div>
              )}
              <div>
                <Label>Route Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={form.route_name} onChange={e => setForm(f => ({ ...f, route_name: e.target.value }))} />
              </div>
              <div>
                <Label>Difficulty Points <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.difficulty_points} onChange={e => setForm(f => ({ ...f, difficulty_points: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => { if (!o) setDeleteTarget(null) }}
        title="Delete Route"
        description={
          deleteTarget && (
            <>
              Permanently delete <strong>Route {deleteTarget.route_id}{deleteTarget.route_name ? ` — ${deleteTarget.route_name}` : ''}</strong>?
              {(deleteTarget.result_count ?? 0) > 0 && (
                <> This will also delete <strong>{deleteTarget.result_count} recorded score{deleteTarget.result_count !== 1 ? 's' : ''}</strong> for this route.</>
              )}
              {' '}This cannot be undone.
            </>
          )
        }
        confirmLabel="Delete Route"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
