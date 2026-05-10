'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import Link from 'next/link'

const cards = [
  { href: '/admin/athletes',   title: 'Athletes',    desc: 'Manage climbers, bulk import via CSV' },
  { href: '/admin/routes',     title: 'Routes',      desc: 'Set up qualifier routes and point values' },
  { href: '/admin/judges',     title: 'Judges',      desc: 'Create judge accounts and assign routes' },
  { href: '/admin/results',    title: 'Results',     desc: 'View and edit submitted scores' },
  { href: '/admin/leaderboard',title: 'Leaderboard', desc: 'Live qualifier rankings by category' },
  { href: '/admin/finals',     title: 'Finals',      desc: 'Manage finals climbers, routes, and scores' },
]

export default function AdminDashboard() {
  const [resetOpen, setResetOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [resetting, setResetting] = useState(false)

  async function handleReset() {
    if (confirmation !== 'delete event') {
      toast.error('Type "delete event" exactly to confirm.')
      return
    }
    setResetting(true)
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success('Event data cleared. Ready for next event.')
      setResetOpen(false)
      setConfirmation('')
    } finally {
      setResetting(false)
    }
  }

  function handleExport() {
    window.open('/api/admin/export-event', '_blank')
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{card.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Event Management ─────────────────────────────────────────────── */}
      <div className="border rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Event Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Export all event data before resetting. Judge accounts and categories are preserved after a reset.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}>
            Export Full Event (Excel)
          </Button>
          <Button variant="destructive" onClick={() => { setConfirmation(''); setResetOpen(true) }}>
            Reset Event Data
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Export includes: Climbers, All Results, per-category Leaderboards, and Finals — all in one .xlsx file.
        </p>
      </div>

      {/* ── Reset confirmation dialog ─────────────────────────────────────── */}
      <Dialog open={resetOpen} onOpenChange={open => { setResetOpen(open); if (!open) setConfirmation('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Reset Event Data</DialogTitle>
            <DialogDescription>
              This will permanently delete all climbers, routes, results, and finals data.
              Judge accounts and categories will be kept.
              <br /><br />
              <strong>This cannot be undone.</strong> Export your data first if you need it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Type <span className="font-mono font-bold">delete event</span> to confirm</Label>
              <Input
                className="mt-2"
                placeholder="delete event"
                value={confirmation}
                onChange={e => setConfirmation(e.target.value)}
                onPaste={e => e.preventDefault()}
              />
              <p className="text-xs text-muted-foreground mt-1">Copy-paste is disabled — you must type it manually.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setResetOpen(false); setConfirmation('') }}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={confirmation !== 'delete event' || resetting}
                onClick={handleReset}
              >
                {resetting ? 'Resetting…' : 'Reset Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
