'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Category { category_id: number; category_name: string }
interface FinalsClimber { climber_id: string; name: string; organisation: string; category: string; gender: string; qualifying_rank: number }

export default function FinalsAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [climbers, setClimbers] = useState<FinalsClimber[]>([])
  const [promoteCategory, setPromoteCategory] = useState('')
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  async function load() {
    const [cats, cl, lb] = await Promise.all([
      fetch('/api/admin/categories').then(r => r.json()),
      fetch('/api/finals/climbers').then(r => r.json()),
      fetch('/api/finals/leaderboard').then(r => r.json()),
    ])
    setCategories(cats); setClimbers(cl); setLeaderboard(lb)
  }

  useEffect(() => { load() }, [])

  async function handlePromote() {
    if (!promoteCategory) { toast.error('Select a category first.'); return }
    const res = await fetch(`/api/finals/promote/${promoteCategory}`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success(data.message); load()
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove from finals?')) return
    const res = await fetch(`/api/finals/climbers/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success('Removed.'); load()
  }

  const selectedCategoryName = categories.find(c => String(c.category_id) === promoteCategory)?.category_name

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
          style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>
          Admin
        </p>
        <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>
          Finals
        </h1>
      </div>

      <Tabs defaultValue="climbers">
        <TabsList>
          <TabsTrigger value="climbers">Finalists</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* ── Finalists tab ──────────────────────────────────────────── */}
        <TabsContent value="climbers" className="space-y-5 mt-4">

          {/* Promote card */}
          <div className="p-5 rounded-2xl" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
              Promote from Qualifiers
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--field-muted)' }}>
              Select a category to auto-promote the top 8 ranked athletes into finals.
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: 'var(--field-text)' }}>Category</label>
                <Select value={promoteCategory} onValueChange={v => setPromoteCategory(v ?? '')}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Select…">
                      {selectedCategoryName ?? <span className="text-muted-foreground">Select…</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.category_id} value={String(c.category_id)}>
                        {c.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold opacity-0 select-none">Go</label>
                <button
                  onClick={handlePromote}
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
                  Promote Top 8
                </button>
              </div>
            </div>
          </div>

          {/* Finalists table */}
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ background: 'var(--field-raised)' }}>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Q.Rank</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {climbers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--field-muted)' }}>
                      No finalists yet. Promote from qualifiers above.
                    </TableCell>
                  </TableRow>
                )}
                {climbers.map(c => (
                  <TableRow key={c.climber_id}>
                    <TableCell className="font-mono text-xs">{c.climber_id}</TableCell>
                    <TableCell className="font-semibold">{c.name}</TableCell>
                    <TableCell style={{ color: 'var(--field-muted)' }}>{c.category}</TableCell>
                    <TableCell style={{ color: 'var(--field-muted)' }}>{c.gender}</TableCell>
                    <TableCell className="tabular-nums font-medium">{c.qualifying_rank || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => handleRemove(c.climber_id)}>Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Leaderboard tab ────────────────────────────────────────── */}
        <TabsContent value="leaderboard" className="mt-4">
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ background: 'var(--field-raised)' }}>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Tops</TableHead>
                  <TableHead className="text-right">Zones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--field-muted)' }}>
                      No finals results yet.
                    </TableCell>
                  </TableRow>
                )}
                {leaderboard.map((r: any) => (
                  <TableRow key={r.climberId}>
                    <TableCell className="font-bold tabular-nums">{r.rank}</TableCell>
                    <TableCell className="font-semibold">{r.name}</TableCell>
                    <TableCell><Badge variant="secondary">{r.category}</Badge></TableCell>
                    <TableCell className="text-right font-bold tabular-nums" style={{ color: 'var(--field-orange)' }}>{r.score.toFixed(1)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.topCount}</TableCell>
                    <TableCell className="text-right tabular-nums" style={{ color: 'var(--field-muted)' }}>{r.zoneCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
