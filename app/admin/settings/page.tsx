'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Event management and data controls.</p>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Event Data</CardTitle>
          <CardDescription>
            Download a full snapshot of the current event — climbers, all results,
            per-category leaderboards, and finals — as a single Excel file.
            Do this before resetting for the next event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport}>Export Full Event (.xlsx)</Button>
        </CardContent>
      </Card>

      {/* Reset */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Reset Event Data</CardTitle>
          <CardDescription>
            Permanently deletes all climbers, routes, results, and finals data.
            Judge accounts and categories are preserved. Use this between events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => { setConfirmation(''); setResetOpen(true) }}>
            Reset Event Data
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
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
