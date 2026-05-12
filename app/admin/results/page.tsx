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
import { Search, Download } from 'lucide-react'

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

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>
            Admin
          </p>
          <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>
            Results
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: 'var(--field-raised)',
              color: 'var(--field-text)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
            <Download className="w-4 h-4" strokeWidth={1.75} />
            CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: 'var(--field-raised)',
              color: 'var(--field-text)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
            <Download className="w-4 h-4" strokeWidth={1.75} />
            Excel
          </button>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          strokeWidth={1.75} style={{ color: 'var(--field-muted)' }} />
        <input
          placeholder="Search by name or ID…"
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

      {/* ── Results table ────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--field-raised)' }}>
              <TableHead>Climber</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Points</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--field-muted)' }}>
                  No results found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(r => (
              <TableRow key={r.result_id}>
                <TableCell>
                  <div className="font-semibold">{r.climber_name}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--field-muted)' }}>{r.climber_id}</div>
                </TableCell>
                <TableCell>{r.route_id}</TableCell>
                <TableCell style={{ color: 'var(--field-muted)' }}>{r.category_name}</TableCell>
                <TableCell>
                  <Badge variant={r.is_top ? 'default' : 'secondary'}>{r.score_type}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">{r.attempts}</TableCell>
                <TableCell className="font-bold tabular-nums" style={{ color: 'var(--field-orange)' }}>{r.points_awarded}</TableCell>
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
      </div>

      {/* ── Edit dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Result — {editing?.climber_name} / Route {editing?.route_id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label>Score Type</Label>
              <Select value={form.score_type} onValueChange={v => setForm(f => ({ ...f, score_type: v ?? 'attempt' }))}>
                <SelectTrigger>
                  <SelectValue>
                    {form.score_type === 'top' ? 'Top' : 'Attempt'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="attempt">Attempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Attempts</Label>
              <Input type="number" min={1} value={form.attempts} onChange={e => setForm(f => ({ ...f, attempts: e.target.value }))} />
            </div>
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
