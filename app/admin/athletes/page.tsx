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
import { Upload, Plus, Search } from 'lucide-react'

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
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const [c, cats] = await Promise.all([
      fetch('/api/admin/climbers').then(r => r.json()),
      fetch('/api/admin/categories').then(r => r.json()),
    ])
    setClimbers(c); setCategories(cats)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditing(null)
    setForm({ climber_id: '', name: '', gender: '', age: '', team_name: '', category_id: '' })
    setOpen(true)
  }
  function openEdit(c: Climber) {
    setEditing(c)
    setForm({ climber_id: c.climber_id, name: c.name, gender: c.gender || '', age: String(c.age || ''), team_name: c.team_name || '', category_id: String(c.categories[0]?.category_id || '') })
    setOpen(true)
  }

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

  const filtered = climbers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.climber_id.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCategoryName = categories.find(c => String(c.category_id) === bulkCategoryId)?.category_name

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
            Athletes
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
          Add athlete
        </button>
      </div>

      {/* ── Bulk import card ─────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
        <div className="mb-4">
          <h3 className="font-bold text-base" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
            Bulk Import
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--field-muted)' }}>
            CSV columns: <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">Climber ID, Name, Gender, Age, Team/Organisation</code>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          {/* Category select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: 'var(--field-text)' }}>
              Category <span style={{ color: 'var(--field-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <Select value={bulkCategoryId} onValueChange={v => setBulkCategoryId(v ?? '')}>
              <SelectTrigger className="w-48">
                {/* Explicit lookup avoids showing raw ID when options load async */}
                <SelectValue placeholder="None">
                  {selectedCategoryName ?? <span className="text-muted-foreground">None</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.category_id} value={String(c.category_id)}>
                    {c.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File chooser — hidden input, styled label as trigger */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: 'var(--field-text)' }}>
              CSV file
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              id="csv-upload"
              className="sr-only"
              onChange={e => setFileName(e.target.files?.[0]?.name || '')}
            />
            <label
              htmlFor="csv-upload"
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
              <span className="truncate">
                {fileName || 'Choose file…'}
              </span>
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

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          strokeWidth={1.75} style={{ color: 'var(--field-muted)' }} />
        <input
          placeholder="Search athletes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none"
          style={{
            background: '#fff',
            boxShadow: 'var(--shadow-xs)',
            color: 'var(--field-text)',
            fontFamily: 'inherit',
            transition: 'box-shadow 160ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onFocus={e => (e.target.style.boxShadow = 'var(--shadow-focus)')}
          onBlur={e => (e.target.style.boxShadow = 'var(--shadow-xs)')}
        />
      </div>

      {/* ── Athletes table ───────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--field-raised)' }}>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--field-muted)' }}>
                  No athletes found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(c => (
              <TableRow key={c.climber_id}>
                <TableCell className="font-mono text-xs">{c.climber_id}</TableCell>
                <TableCell className="font-semibold">{c.name}</TableCell>
                <TableCell>{c.gender || '—'}</TableCell>
                <TableCell style={{ color: 'var(--field-muted)' }}>{c.team_name || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {c.categories.map(cat => (
                      <Badge key={cat.category_id} variant="secondary">{cat.category_name}</Badge>
                    ))}
                  </div>
                </TableCell>
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
      </div>

      {/* ── Add / Edit dialog ────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Athlete' : 'Add Athlete'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {!editing && (
              <div>
                <Label>Climber ID</Label>
                <Input value={form.climber_id} onChange={e => setForm(f => ({ ...f, climber_id: e.target.value }))} />
              </div>
            )}
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Gender</Label>
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
              <Label>Age</Label>
              <Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
            <div>
              <Label>Team / Organisation</Label>
              <Input value={form.team_name} onChange={e => setForm(f => ({ ...f, team_name: e.target.value }))} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v ?? '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="None">
                    {categories.find(c => String(c.category_id) === form.category_id)?.category_name
                      ?? <span className="text-muted-foreground">None</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>
                  ))}
                </SelectContent>
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
