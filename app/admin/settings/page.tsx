'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Download, AlertTriangle } from 'lucide-react'

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

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
          style={{ color: 'var(--field-orange)', letterSpacing: '0.12em' }}>
          Admin
        </p>
        <h1 className="font-bold text-3xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--field-muted)' }}>
          Event management and data controls.
        </p>
      </div>

      {/* ── Export card ──────────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="font-bold text-base mb-1" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
          Export Event Data
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--field-muted)', lineHeight: 1.6 }}>
          Download a full snapshot of the current event — climbers, all results,
          per-category leaderboards, and finals — as a single Excel file.
          Do this before resetting for the next event.
        </p>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{
            background: 'var(--field-orange)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
          <Download className="w-4 h-4" strokeWidth={1.75} />
          Export Full Event (.xlsx)
        </button>
      </div>

      {/* ── Reset card ───────────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl" style={{
        background: '#fff',
        boxShadow: 'var(--shadow-sm), 0 0 0 1.5px rgba(239,68,68,0.15)',
      }}>
        <div className="flex items-start gap-3 mb-1">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" strokeWidth={1.75} style={{ color: '#EF4444' }} />
          <h3 className="font-bold text-base" style={{ color: '#DC2626', letterSpacing: '-0.01em' }}>
            Reset Event Data
          </h3>
        </div>
        <p className="text-sm mb-4 pl-8" style={{ color: 'var(--field-muted)', lineHeight: 1.6 }}>
          Permanently deletes all climbers, routes, results, and finals data.
          Judge accounts and categories are preserved. Use this between events.
        </p>
        <div className="pl-8">
          <Button variant="destructive" onClick={() => { setConfirmation(''); setResetOpen(true) }}>
            Reset Event Data
          </Button>
        </div>
      </div>

      {/* ── Confirmation dialog ──────────────────────────────────────── */}
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
              <Label>
                Type <span className="font-mono font-bold">delete event</span> to confirm
              </Label>
              <Input
                className="mt-2"
                placeholder="delete event"
                value={confirmation}
                onChange={e => setConfirmation(e.target.value)}
                onPaste={e => e.preventDefault()}
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--field-muted)' }}>
                Copy-paste is disabled — you must type it manually.
              </p>
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
