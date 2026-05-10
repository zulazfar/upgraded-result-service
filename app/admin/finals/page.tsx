'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Finals Management</h1>
      <Tabs defaultValue="climbers">
        <TabsList>
          <TabsTrigger value="climbers">Finalists</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="climbers" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Promote from Qualifiers</CardTitle></CardHeader>
            <CardContent className="flex gap-3 items-end">
              <div>
                <Label>Category</Label>
                <Select value={promoteCategory} onValueChange={v => setPromoteCategory(v ?? '')}>
                  <SelectTrigger className="w-52"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handlePromote}>Promote Top 8</Button>
            </CardContent>
          </Card>

          <Table>
            <TableHeader>
              <TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Gender</TableHead><TableHead>Q.Rank</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {climbers.map(c => (
                <TableRow key={c.climber_id}>
                  <TableCell className="font-mono text-xs">{c.climber_id}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.category}</TableCell>
                  <TableCell>{c.gender}</TableCell>
                  <TableCell>{c.qualifying_rank || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="destructive" onClick={() => handleRemove(c.climber_id)}>Remove</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Rank</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Score</TableHead><TableHead className="text-right">Tops</TableHead><TableHead className="text-right">Zones</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((r: any) => (
                <TableRow key={r.climberId}>
                  <TableCell className="font-bold">{r.rank}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell><Badge variant="secondary">{r.category}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{r.score.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{r.topCount}</TableCell>
                  <TableCell className="text-right">{r.zoneCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}
