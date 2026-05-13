'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Download, Upload, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  // ── Reset state ─────────────────────────────────────────────────────────
  const [resetOpen, setResetOpen] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState('')
  const [resetting, setResetting] = useState(false)

  // ── Seed state ──────────────────────────────────────────────────────────
  const [seedOpen, setSeedOpen] = useState(false)
  const [seedHasData, setSeedHasData] = useState(false)
  const [seedInfo, setSeedInfo] = useState<{ climberCount: number; routeCount: number; resultCount: number } | null>(null)
  const [seedConfirmation, setSeedConfirmation] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [checkingData, setCheckingData] = useState(false)

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleExport() {
    window.open('/api/admin/export-event', '_blank')
  }

  async function openSeedDialog() {
    setCheckingData(true)
    setSeedConfirmation('')
    try {
      const res = await fetch('/api/admin/seed')
      if (!res.ok) { toast.error('Could not check data status.'); return }
      const data = await res.json()
      setSeedHasData(data.hasData)
      setSeedInfo({ climberCount: data.climberCount, routeCount: data.routeCount, resultCount: data.resultCount })
      setSeedOpen(true)
    } finally {
      setCheckingData(false)
    }
  }

  async function handleSeed() {
    if (seedHasData && seedConfirmation !== 'overwrite data') {
      toast.error('Type "overwrite data" exactly to confirm.')
      return
    }
    setSeeding(true)
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: seedHasData ? seedConfirmation : '' }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success(data.message)
      setSeedOpen(false)
      setSeedConfirmation('')
    } finally {
      setSeeding(false)
    }
  }

  async function handleReset() {
    if (resetConfirmation !== 'delete event') {
      toast.error('Type "delete event" exactly to confirm.')
      return
    }
    setResetting(true)
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: resetConfirmation }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message); return }
      toast.success('Event data cleared. Ready for next event.')
      setResetOpen(false)
      setResetConfirmation('')
    } finally {
      setResetting(false)
    }
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

      {/* ── Sample data card ─────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl" style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="font-bold text-base mb-1" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
          Import Sample Data
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--field-muted)', lineHeight: 1.6 }}>
          Load a pre-built dataset for testing — 20 athletes across 4 categories
          (Open Male, Open Female, Youth A Male, Youth A Female), 10 routes, and
          representative qualifier results. Useful for demos and development.
        </p>
        <button
          onClick={openSeedDialog}
          disabled={checkingData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{
            background: 'var(--field-raised)',
            color: 'var(--field-text)',
            border: 'none',
            cursor: checkingData ? 'not-allowed' : 'pointer',
            opacity: checkingData ? 0.6 : 1,
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
          <Upload className="w-4 h-4" strokeWidth={1.75} />
          {checkingData ? 'Checking…' : 'Import Sample Data'}
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
          <Button variant="destructive" onClick={() => { setResetConfirmation(''); setResetOpen(true) }}>
            Reset Event Data
          </Button>
        </div>
      </div>

      {/* ── Seed dialog ──────────────────────────────────────────────── */}
      <Dialog open={seedOpen} onOpenChange={open => { setSeedOpen(open); if (!open) setSeedConfirmation('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Sample Data</DialogTitle>
            <DialogDescription>
              {seedHasData ? (
                <>
                  Your database already contains{' '}
                  <strong>{seedInfo?.climberCount} athlete{seedInfo?.climberCount !== 1 ? 's' : ''}</strong>,{' '}
                  <strong>{seedInfo?.routeCount} route{seedInfo?.routeCount !== 1 ? 's' : ''}</strong>, and{' '}
                  <strong>{seedInfo?.resultCount} result{seedInfo?.resultCount !== 1 ? 's' : ''}</strong>.
                  {' '}Importing sample data will overwrite all of this.
                </>
              ) : (
                'No existing event data detected. Sample data will be loaded immediately.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {seedHasData ? (
              <>
                <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2.5"
                  style={{ background: '#FEF2F2', color: '#DC2626', boxShadow: '0 0 0 1px rgba(239,68,68,0.2)' }}>
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} />
                  <span>This will permanently replace your existing event data. This cannot be undone.</span>
                </div>
                <div>
                  <Label>
                    Type <span className="font-mono font-bold">overwrite data</span> to confirm
                  </Label>
                  <Input
                    className="mt-2"
                    placeholder="overwrite data"
                    value={seedConfirmation}
                    onChange={e => setSeedConfirmation(e.target.value)}
                    onPaste={e => e.preventDefault()}
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--field-muted)' }}>
                    Copy-paste is disabled — you must type it manually.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setSeedOpen(false); setSeedConfirmation('') }}>Cancel</Button>
                  <Button
                    variant="destructive"
                    disabled={seedConfirmation !== 'overwrite data' || seeding}
                    onClick={handleSeed}
                  >
                    {seeding ? 'Importing…' : 'Overwrite & Import'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ background: 'var(--field-green-dim)', color: 'var(--field-green-text)', boxShadow: '0 0 0 1px rgba(22,163,74,0.2)' }}>
                  Ready to load: 20 athletes, 10 routes, 4 categories, and qualifier results.
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSeedOpen(false)}>Cancel</Button>
                  <Button disabled={seeding} onClick={handleSeed}>
                    {seeding ? 'Importing…' : 'Import Sample Data'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reset confirmation dialog ────────────────────────────────── */}
      <Dialog open={resetOpen} onOpenChange={open => { setResetOpen(open); if (!open) setResetConfirmation('') }}>
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
                value={resetConfirmation}
                onChange={e => setResetConfirmation(e.target.value)}
                onPaste={e => e.preventDefault()}
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--field-muted)' }}>
                Copy-paste is disabled — you must type it manually.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setResetOpen(false); setResetConfirmation('') }}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={resetConfirmation !== 'delete event' || resetting}
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
