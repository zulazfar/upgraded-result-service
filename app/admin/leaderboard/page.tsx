'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Category { category_id: number; category_name: string }
interface Result { climber_id?: string; climber_name?: string; team_name?: string; total_points: number; total_tops: number; total_attempts: number; tie_breaker_score?: number }
interface CategoryResults { category_name: string; is_team_category: boolean; results: Result[] }

export default function LeaderboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [data, setData] = useState<CategoryResults | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/admin/categories').then(r => r.json()).then(setCategories) }, [])

  async function load(id: string) {
    if (!id) return
    setLoading(true)
    const res = await fetch(`/api/results/category/${id}`)
    setData(await res.json())
    setLoading(false)
  }

  function handleExport() {
    window.open(`/api/results/export?format=xlsx&category_id=${categoryId}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <div className="flex gap-3 items-center">
          <Select value={categoryId} onValueChange={v => { const val = v ?? ''; setCategoryId(val); load(val) }}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Select category…" /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>)}</SelectContent>
          </Select>
          {data && <Button variant="outline" size="sm" onClick={handleExport}>Export Excel</Button>}
        </div>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {data && (
        <>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{data.category_name}</h2>
            {data.is_team_category && <Badge variant="secondary">Team</Badge>}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>{data.is_team_category ? 'Team' : 'Athlete'}</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Tops</TableHead>
                <TableHead className="text-right">Attempts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((r, i) => (
                <TableRow key={i} className={i < 3 ? 'font-medium' : ''}>
                  <TableCell>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </TableCell>
                  <TableCell>{data.is_team_category ? r.team_name : r.climber_name}</TableCell>
                  <TableCell className="text-right">{r.total_points}</TableCell>
                  <TableCell className="text-right">{r.total_tops}</TableCell>
                  <TableCell className="text-right">{r.total_attempts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  )
}
