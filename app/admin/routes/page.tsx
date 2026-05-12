'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, Plus } from 'lucide-react'

interface Route { route_id: number; route_name: string; difficulty_points: number }

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Route | null>(null)
  const [form, setForm] = useState({ route_id: '', route_name: '', difficulty_points: '' })
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const data = await fetch('/api/admin/routes').then(r => r.json())
    setRoutes(data)
  }

  useEffect(() => { load() }, [])

  function openAdd() { setEditing(null); setForm({ route_id: '', route_name: '', difficulty_points: '' }); setOpen(true) }
  function openEdit(r: Route) { setEditing(r); setForm({ route_id: String(r.route_id), route_name: r.route_name || '', difficulty_points: String(r.difficulty_points) }); setOpen(true) }

  async function handleSave() {
    const payload = { route_id: parseInt(form.route_id), route_name: form.route_name || null, difficulty_points: parseInt(form.difficulty_points) }
    const url = editing ? `/api/admin/routes/${editing.route_id}` : '/api/admin/routes'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success(editing ? 'Route updated.' : 'Route added.')
    setOpen(false); load()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this route? This will remove all associated scores.')) return
    const res = await fetch(`/api/admin/routes/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success('Route deleted.'); load()
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

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>
            Admin
          </p>
          <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>
            Routes
          </h1>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{
            background: 'var(--field-orange)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
          <Plus className="w-4 h-4" strokeWidth={2} />
          Add Route
        </button>
      </div>

      {/* ── Bulk import card ─────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
        <div className="mb-4">
          <h3 className="font-bold text-base" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
            Bulk Import
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--field-muted)' }}>
            CSV columns: <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">Route ID, Route Name, Points</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          {/* File chooser */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: 'var(--field-text)' }}>CSV file</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              id="csv-upload-routes"
              className="sr-only"
              onChange={e => setFileName(e.target.files?.[0]?.name || '')}
            />
            <label
              htmlFor="csv-upload-routes"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer select-none"
              style={{
                background: 'var(--field-raised)',
                color: fileName ? 'var(--field-text)' : 'var(--field-muted)',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                maxWidth: '220px',
                display: 'flex',
              }}>
              <Upload className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{fileName || 'Choose file…'}</span>
            </label>
          </div>
          {/* Import button */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold opacity-0 select-none">Go</label>
            <button
              onClick={handleBulk}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold"
              style={{
                background: 'var(--field-orange)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                whiteSpace: 'nowrap',
              }}>
              Import CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Routes table ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--field-raised)' }}>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Points</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-sm" style={{ color: 'var(--field-muted)' }}>
                  No routes found.
                </TableCell>
              </TableRow>
            )}
            {routes.map(r => (
              <TableRow key={r.route_id}>
                <TableCell className="font-mono text-xs">{r.route_id}</TableCell>
                <TableCell className="font-semibold">{r.route_name || '—'}</TableCell>
                <TableCell style={{ color: 'var(--field-muted)' }}>{r.difficulty_points}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(r.route_id)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Add / Edit dialog ─────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Route' : 'Add Route'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {!editing && (
              <div>
                <Label>Route ID</Label>
                <Input type="number" value={form.route_id} onChange={e => setForm(f => ({ ...f, route_id: e.target.value }))} />
              </div>
            )}
            <div>
              <Label>Route Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={form.route_name} onChange={e => setForm(f => ({ ...f, route_name: e.target.value }))} />
            </div>
            <div>
              <Label>Difficulty Points</Label>
              <Input type="number" value={form.difficulty_points} onChange={e => setForm(f => ({ ...f, difficulty_points: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
