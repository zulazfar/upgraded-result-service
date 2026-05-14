'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, ShieldCheck, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface Judge { judge_id: number; name: string; username: string; is_superadmin: boolean; route_count: number }
interface Route { route_id: number; route_name: string; difficulty_points: number; assigned: boolean }
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

export default function JudgesPage() {
  const [judges, setJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortState>({ col: 'name', dir: 'asc' })
  const [open, setOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editing, setEditing] = useState<Judge | null>(null)
  const [assignJudge, setAssignJudge] = useState<Judge | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [form, setForm] = useState({ name: '', username: '', password: '', is_superadmin: false })
  const [saving, setSaving] = useState(false)
  const [savingAssign, setSavingAssign] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Judge | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [verifyPass, setVerifyPass] = useState('')

  async function load() {
    setLoading(true)
    setJudges(await fetch('/api/admin/judges').then(r => r.json()))
    setLoading(false)
  }
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

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault()
    // Granting admin to a new account or promoting an existing non-admin requires password verification
    const grantingAdmin = form.is_superadmin && (!editing || !editing.is_superadmin)
    if (grantingAdmin) {
      setVerifyPass(''); setVerifyOpen(true); return
    }
    await doSave()
  }

  async function doSave(adminPassword?: string) {
    setSaving(true)
    try {
      const url = editing ? `/api/admin/judges/${editing.judge_id}` : '/api/admin/judges'
      const method = editing ? 'PUT' : 'POST'
      const body = adminPassword ? { ...form, admin_password: adminPassword } : form
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success(editing ? 'Judge updated.' : 'Judge added.')
      setOpen(false); setVerifyOpen(false); load()
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/judges/${deleteTarget.judge_id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success('Judge deleted.')
      setDeleteTarget(null); load()
    } finally { setDeleting(false) }
  }

  async function handleSaveAssignments() {
    setSavingAssign(true)
    try {
      const res = await fetch(`/api/admin/judges/${assignJudge!.judge_id}/assignments`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_ids: Array.from(selected) })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success('Assignments saved.'); setAssignOpen(false)
    } finally { setSavingAssign(false) }
  }

  function toggleRoute(id: number) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const sorted = [...judges].sort((a, b) => {
    const av = sort.col === 'is_superadmin' ? (a.is_superadmin ? 0 : 1) : (a as any)[sort.col] ?? ''
    const bv = sort.col === 'is_superadmin' ? (b.is_superadmin ? 0 : 1) : (b as any)[sort.col] ?? ''
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
          <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>Judges</h1>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'var(--field-orange)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <Plus className="w-4 h-4" strokeWidth={2} />Add Judge
        </button>
      </div>

      {/* ── Count ────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--field-muted)' }}>
          {loading ? '—' : `${judges.length} judge${judges.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Judges table ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ background: 'var(--field-raised)' }}>
              <SortTh col="name" label="Name" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <TableHead>Username</TableHead>
              <SortTh col="is_superadmin" label="Role" sort={sort} onSort={c => setSort(s => toggleSort(s, c))} />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableSkeleton columns={4} rows={4} />
          ) : (
            <TableBody>
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--field-raised)' }}>
                        <ShieldCheck className="w-5 h-5" strokeWidth={1.5} style={{ color: 'var(--field-muted)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--field-text)' }}>No judges yet</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--field-muted)' }}>Add your first judge account to enable scoring</p>
                      </div>
                      <button onClick={openAdd}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--field-orange)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        <Plus className="w-3.5 h-3.5" strokeWidth={2} />Add judge
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {sorted.map(j => (
                <TableRow key={j.judge_id} className="hover:bg-[var(--field-raised)] transition-colors">
                  <TableCell className="font-semibold">{j.name}</TableCell>
                  <TableCell className="font-mono text-xs">{j.username}</TableCell>
                  <TableCell>
                    <Badge variant={j.is_superadmin ? 'default' : 'secondary'}>
                      {j.is_superadmin ? 'Admin' : 'Judge'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openAssign(j)} className="gap-1.5">
                        Routes
                        {j.route_count > 0 && (
                          <span className="inline-flex items-center justify-center text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-full min-w-[20px]"
                            style={{ background: 'var(--field-orange)', color: '#fff', fontSize: '10px' }}>
                            {j.route_count}
                          </span>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(j)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(j)}>Delete</Button>
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
            <DialogTitle>{editing ? 'Edit Judge' : 'Add Judge'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="space-y-3 pt-1">
              <div>
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Username <span className="text-destructive">*</span></Label>
                <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <Label>
                  {editing ? 'New Password' : 'Password'}{' '}
                  {editing && <span className="text-muted-foreground font-normal">(leave blank to keep)</span>}
                </Label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>

              {/* E3 — styled toggle instead of raw checkbox */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--field-text)' }}>Super Admin</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--field-muted)' }}>Grants access to the admin dashboard</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_superadmin}
                  onClick={() => setForm(f => ({ ...f, is_superadmin: !f.is_superadmin }))}
                  className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200"
                  style={{ background: form.is_superadmin ? 'var(--field-orange)' : 'var(--field-border)' }}>
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200"
                    style={{ transform: form.is_superadmin ? 'translateX(18px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Route assignment dialog ───────────────────────────────────── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Routes — {assignJudge?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 pt-1">
            {routes.length === 0 && (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--field-muted)' }}>No routes configured yet.</p>
            )}
            {routes.map(r => (
              <label key={r.route_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                style={{ transition: 'background 120ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--field-raised)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <input
                  type="checkbox"
                  checked={selected.has(r.route_id)}
                  onChange={() => toggleRoute(r.route_id)}
                  className="w-4 h-4 rounded accent-blue-600 shrink-0"
                />
                <span className="text-sm font-medium" style={{ color: 'var(--field-text)' }}>
                  Route {r.route_id}{r.route_name ? ` — ${r.route_name}` : ''}
                </span>
                <span className="ml-auto text-xs font-medium tabular-nums" style={{ color: 'var(--field-muted)' }}>
                  {r.difficulty_points} pts
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAssignOpen(false)} disabled={savingAssign}>Cancel</Button>
            <Button type="button" onClick={handleSaveAssignments} disabled={savingAssign}>
              {savingAssign ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => { if (!o) setDeleteTarget(null) }}
        title="Delete Judge"
        description={<>Permanently delete judge <strong>{deleteTarget?.name}</strong>? Their route assignments will also be removed.</>}
        confirmLabel="Delete Judge"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* ── Admin password verification ───────────────────────────────── */}
      <Dialog open={verifyOpen} onOpenChange={o => { if (!saving) setVerifyOpen(o) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Identity</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <p className="text-sm" style={{ color: 'var(--field-muted)' }}>
              Granting admin access is a sensitive action. Enter your own password to confirm.
            </p>
            <div>
              <Label>Your Password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                value={verifyPass}
                onChange={e => setVerifyPass(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && verifyPass) doSave(verifyPass) }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setVerifyOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="button" disabled={saving || !verifyPass} onClick={() => doSave(verifyPass)}>
                {saving ? 'Confirming…' : 'Confirm & Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
