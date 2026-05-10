'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Judge { judge_id: number; name: string; username: string; is_superadmin: boolean }
interface Route { route_id: number; route_name: string; difficulty_points: number; assigned: boolean }

export default function JudgesPage() {
  const [judges, setJudges] = useState<Judge[]>([])
  const [open, setOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editing, setEditing] = useState<Judge | null>(null)
  const [assignJudge, setAssignJudge] = useState<Judge | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [form, setForm] = useState({ name: '', username: '', password: '', is_superadmin: false })

  async function load() { setJudges(await fetch('/api/admin/judges').then(r => r.json())) }
  useEffect(() => { load() }, [])

  function openAdd() { setEditing(null); setForm({ name: '', username: '', password: '', is_superadmin: false }); setOpen(true) }
  function openEdit(j: Judge) { setEditing(j); setForm({ name: j.name, username: j.username, password: '', is_superadmin: j.is_superadmin }); setOpen(true) }

  async function openAssign(j: Judge) {
    setAssignJudge(j)
    const data: Route[] = await fetch(`/api/admin/judges/${j.judge_id}/assignments`).then(r => r.json())
    setRoutes(data)
    setSelected(new Set(data.filter(r => r.assigned).map(r => r.route_id)))
    setAssignOpen(true)
  }

  async function handleSave() {
    const url = editing ? `/api/admin/judges/${editing.judge_id}` : '/api/admin/judges'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success(editing ? 'Judge updated.' : 'Judge added.')
    setOpen(false); load()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this judge?')) return
    const res = await fetch(`/api/admin/judges/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success('Judge deleted.'); load()
  }

  async function handleSaveAssignments() {
    const res = await fetch(`/api/admin/judges/${assignJudge!.judge_id}/assignments`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route_ids: Array.from(selected) })
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success('Assignments saved.'); setAssignOpen(false)
  }

  function toggleRoute(id: number) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Judges</h1>
        <Button onClick={openAdd}>Add Judge</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {judges.map(j => (
            <TableRow key={j.judge_id}>
              <TableCell className="font-medium">{j.name}</TableCell>
              <TableCell>{j.username}</TableCell>
              <TableCell><Badge variant={j.is_superadmin ? 'default' : 'secondary'}>{j.is_superadmin ? 'Admin' : 'Judge'}</Badge></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => openAssign(j)}>Routes</Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(j)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(j.judge_id)}>Delete</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Judge' : 'Add Judge'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Username</Label><Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></div>
            <div><Label>{editing ? 'New Password (leave blank to keep)' : 'Password'}</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_superadmin} onChange={e => setForm(f => ({ ...f, is_superadmin: e.target.checked }))} id="admin" /><Label htmlFor="admin">Super Admin</Label></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Routes — {assignJudge?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {routes.map(r => (
              <label key={r.route_id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" checked={selected.has(r.route_id)} onChange={() => toggleRoute(r.route_id)} />
                <span className="text-sm">Route {r.route_id}{r.route_name ? ` — ${r.route_name}` : ''} <span className="text-muted-foreground">({r.difficulty_points} pts)</span></span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAssignments}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
