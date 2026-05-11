'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Route { route_id: number; route_name: string; difficulty_points: number }

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Route | null>(null)
  const [form, setForm] = useState({ route_id: '', route_name: '', difficulty_points: '' })
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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-wide uppercase" style={{ letterSpacing: '0.08em', fontFamily: 'var(--font-heading, "Barlow Condensed", sans-serif)' }}>Routes</h1>
        <Button onClick={openAdd}>Add Route</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Bulk Import (CSV)</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">CSV columns: <code>Route ID, Route Name, Points</code></p>
          <div className="flex gap-3 items-center">
            <input ref={fileRef} type="file" accept=".csv" className="text-sm" />
            <Button variant="outline" onClick={handleBulk}>Import CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Points</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map(r => (
            <TableRow key={r.route_id}>
              <TableCell>{r.route_id}</TableCell>
              <TableCell>{r.route_name || '—'}</TableCell>
              <TableCell>{r.difficulty_points}</TableCell>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Route' : 'Add Route'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {!editing && <div><Label>Route ID</Label><Input type="number" value={form.route_id} onChange={e => setForm(f => ({ ...f, route_id: e.target.value }))} /></div>}
            <div><Label>Route Name (optional)</Label><Input value={form.route_name} onChange={e => setForm(f => ({ ...f, route_name: e.target.value }))} /></div>
            <div><Label>Difficulty Points</Label><Input type="number" value={form.difficulty_points} onChange={e => setForm(f => ({ ...f, difficulty_points: e.target.value }))} /></div>
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
