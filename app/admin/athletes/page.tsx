'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Category { category_id: number; category_name: string }
interface Climber { climber_id: string; name: string; gender: string; age: number; team_name: string; categories: Category[] }

export default function AthletesPage() {
  const [climbers, setClimbers] = useState<Climber[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Climber | null>(null)
  const [form, setForm] = useState({ climber_id: '', name: '', gender: '', age: '', team_name: '', category_id: '' })
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const [c, cats] = await Promise.all([fetch('/api/admin/climbers').then(r => r.json()), fetch('/api/admin/categories').then(r => r.json())])
    setClimbers(c); setCategories(cats)
  }

  useEffect(() => { load() }, [])

  function openAdd() { setEditing(null); setForm({ climber_id: '', name: '', gender: '', age: '', team_name: '', category_id: '' }); setOpen(true) }
  function openEdit(c: Climber) { setEditing(c); setForm({ climber_id: c.climber_id, name: c.name, gender: c.gender || '', age: String(c.age || ''), team_name: c.team_name || '', category_id: String(c.categories[0]?.category_id || '') }); setOpen(true) }

  async function handleSave() {
    const payload = { ...form, age: form.age ? parseInt(form.age) : null, category_ids: form.category_id ? [parseInt(form.category_id)] : [] }
    const url = editing ? `/api/admin/climbers/${editing.climber_id}` : '/api/admin/climbers'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success(editing ? 'Athlete updated.' : 'Athlete added.')
    setOpen(false); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this athlete?')) return
    const res = await fetch(`/api/admin/climbers/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success('Athlete deleted.'); load()
  }

  async function handleBulk() {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.error('Select a CSV file.'); return }
    const fd = new FormData(); fd.append('file', file)
    if (bulkCategoryId) fd.append('category_id', bulkCategoryId)
    const res = await fetch('/api/admin/climbers/bulk', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success(data.message); load()
    if (fileRef.current) fileRef.current.value = ''
  }

  const filtered = climbers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.climber_id.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-wide uppercase" style={{ letterSpacing: '0.08em', fontFamily: 'var(--font-heading, "Barlow Condensed", sans-serif)' }}>Athletes</h1>
        <Button onClick={openAdd}>Add Athlete</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Bulk Import (CSV)</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">CSV columns: <code>Climber ID, Name, Gender, Age, Team/Organisation</code></p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs">Category (optional)</Label>
              <Select value={bulkCategoryId} onValueChange={v => setBulkCategoryId(v ?? '')}>
                <SelectTrigger className="w-44"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="text-sm" />
            <Button variant="outline" onClick={handleBulk}>Import CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Input placeholder="Search athletes…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Gender</TableHead>
            <TableHead>Team</TableHead><TableHead>Categories</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(c => (
            <TableRow key={c.climber_id}>
              <TableCell className="font-mono text-xs">{c.climber_id}</TableCell>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.gender || '—'}</TableCell>
              <TableCell>{c.team_name || '—'}</TableCell>
              <TableCell><div className="flex gap-1 flex-wrap">{c.categories.map(cat => <Badge key={cat.category_id} variant="secondary">{cat.category_name}</Badge>)}</div></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(c.climber_id)}>Delete</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Athlete' : 'Add Athlete'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {!editing && <div><Label>Climber ID</Label><Input value={form.climber_id} onChange={e => setForm(f => ({ ...f, climber_id: e.target.value }))} /></div>}
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Gender</Label>
              <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v ?? '' }))}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Age</Label><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></div>
            <div><Label>Team / Organisation</Label><Input value={form.team_name} onChange={e => setForm(f => ({ ...f, team_name: e.target.value }))} /></div>
            <div><Label>Category</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v ?? '' }))}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>)}</SelectContent>
              </Select>
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
