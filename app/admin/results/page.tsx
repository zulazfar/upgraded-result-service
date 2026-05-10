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

interface Result {
  result_id: number; climber_id: string; climber_name: string
  route_id: number; category_name: string; attempts: number
  is_top: boolean; points_awarded: number; score_type: string; timestamp: string
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Result | null>(null)
  const [form, setForm] = useState({ score_type: 'attempt', attempts: '1' })

  async function load() { setResults(await fetch('/api/admin/results').then(r => r.json())) }
  useEffect(() => { load() }, [])

  function openEdit(r: Result) { setEditing(r); setForm({ score_type: r.score_type, attempts: String(r.attempts) }) }

  async function handleSave() {
    const res = await fetch(`/api/admin/results/${editing!.result_id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score_type: form.score_type, attempts: parseInt(form.attempts) })
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success(`Result updated. Points: ${data.points_awarded}`)
    setEditing(null); load()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this result?')) return
    const res = await fetch(`/api/admin/results/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success('Result deleted.'); load()
  }

  function handleExport(format: 'csv' | 'xlsx') {
    window.open(`/api/results/export?format=${format}`, '_blank')
  }

  const filtered = results.filter(r =>
    r.climber_name.toLowerCase().includes(search.toLowerCase()) ||
    r.climber_id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Results</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>Export CSV</Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>Export Excel</Button>
        </div>
      </div>

      <Input placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Climber</TableHead><TableHead>Route</TableHead><TableHead>Category</TableHead>
            <TableHead>Type</TableHead><TableHead>Attempts</TableHead><TableHead>Points</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(r => (
            <TableRow key={r.result_id}>
              <TableCell><div className="font-medium">{r.climber_name}</div><div className="text-xs text-muted-foreground">{r.climber_id}</div></TableCell>
              <TableCell>{r.route_id}</TableCell>
              <TableCell>{r.category_name}</TableCell>
              <TableCell><Badge variant={r.is_top ? 'default' : 'secondary'}>{r.score_type}</Badge></TableCell>
              <TableCell>{r.attempts}</TableCell>
              <TableCell>{r.points_awarded}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(r.result_id)}>Delete</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Result — {editing?.climber_name} / Route {editing?.route_id}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Score Type</Label>
              <Select value={form.score_type} onValueChange={v => setForm(f => ({ ...f, score_type: v ?? 'attempt' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="top">Top</SelectItem><SelectItem value="attempt">Attempt</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Attempts</Label><Input type="number" min={1} value={form.attempts} onChange={e => setForm(f => ({ ...f, attempts: e.target.value }))} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={handleSave}>Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
