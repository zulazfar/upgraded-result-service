'use client'

import { useEffect, useState, useCallback } from 'react'

interface Category { category_id: number; category_name: string }
interface QualResult { climber_id?: string; climber_name?: string; team_name?: string; total_points: number; total_tops: number; total_attempts: number }
interface FinalsResult { rank: number; climberId: string; name: string; category: string; score: number; topCount: number; zoneCount: number; attemptsToTop: number; attemptsToZone: number }

const MEDAL = ['🥇', '🥈', '🥉']

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) return <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{MEDAL[rank - 1]}</span>
  return (
    <span className="font-mono text-base font-bold" style={{ color: 'var(--field-muted)', minWidth: 28, display: 'inline-block', textAlign: 'center' }}>
      {rank}
    </span>
  )
}

export default function LeaderboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [qualData, setQualData] = useState<{ category_name: string; is_team_category: boolean; results: QualResult[] } | null>(null)
  const [finalsData, setFinalsData] = useState<FinalsResult[]>([])
  const [tab, setTab] = useState<'qualifiers' | 'finals'>('qualifiers')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const loadFinals = useCallback(() => {
    fetch('/api/finals/leaderboard').then(r => r.json()).then(setFinalsData)
  }, [])

  const loadCategory = useCallback(async (id: string) => {
    setCategoryId(id)
    if (!id) { setQualData(null); return }
    const res = await fetch(`/api/results/category/${id}`)
    setQualData(await res.json())
  }, [])

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(setCategories)
    loadFinals()
  }, [loadFinals])

  function refresh() {
    loadFinals()
    if (categoryId) loadCategory(categoryId)
    setLastRefresh(new Date())
  }

  return (
    <div className="field-page min-h-screen" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Background grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(var(--field-border) 1px, transparent 1px), linear-gradient(90deg, var(--field-border) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Header */}
      <div className="relative" style={{ borderBottom: '1px solid var(--field-border)', background: 'var(--field-surface)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block w-1.5 h-7 rounded-sm" style={{ background: 'var(--field-orange)' }} />
            <div>
              <div className="font-heading font-bold text-2xl leading-none" style={{ color: 'var(--field-text)', letterSpacing: '0.12em' }}>LEADERBOARD</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>LIVE RESULTS</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>
              {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button onClick={refresh}
              className="px-4 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all"
              style={{ background: 'var(--field-raised)', color: 'var(--field-text)', border: '1px solid var(--field-border)', cursor: 'pointer', letterSpacing: '0.1em' }}>
              REFRESH
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-4xl mx-auto px-4 flex" style={{ borderTop: '1px solid var(--field-border)' }}>
          {(['qualifiers', 'finals'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-6 py-3 text-xs font-heading font-bold uppercase tracking-widest transition-all relative"
              style={{ color: tab === t ? 'var(--field-orange)' : 'var(--field-muted)', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.14em' }}>
              {t.toUpperCase()}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: 'var(--field-orange)' }} />}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 relative">

        {/* ── QUALIFIERS ─────────────────────────────────────────────── */}
        {tab === 'qualifiers' && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c.category_id} onClick={() => loadCategory(String(c.category_id))}
                  className="px-4 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: categoryId === String(c.category_id) ? 'var(--field-orange)' : 'var(--field-surface)',
                    border: `1px solid ${categoryId === String(c.category_id) ? 'var(--field-orange)' : 'var(--field-border)'}`,
                    color: categoryId === String(c.category_id) ? '#fff' : 'var(--field-muted)',
                    cursor: 'pointer',
                    boxShadow: categoryId === String(c.category_id) ? '0 0 12px color-mix(in srgb, var(--field-orange) 30%, transparent)' : 'none',
                  }}>
                  {c.category_name}
                </button>
              ))}
            </div>

            {qualData && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-heading font-bold text-xl" style={{ color: 'var(--field-text)', letterSpacing: '0.08em' }}>
                    {qualData.category_name.toUpperCase()}
                  </h2>
                  {qualData.is_team_category && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--field-raised)', color: 'var(--field-muted)', fontFamily: 'var(--font-mono)', border: '1px solid var(--field-border)' }}>TEAM</span>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--field-border)', background: 'var(--field-surface)' }}>
                  <div className="grid px-4 py-2.5 text-xs font-semibold uppercase tracking-widest"
                    style={{ gridTemplateColumns: '48px 1fr 80px 60px 70px', borderBottom: '1px solid var(--field-border)', color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>#</span><span>{qualData.is_team_category ? 'TEAM' : 'ATHLETE'}</span>
                    <span className="text-right">PTS</span><span className="text-right">TOPS</span><span className="text-right">ATT</span>
                  </div>
                  {qualData.results.map((r, i) => (
                    <div key={i} className="grid px-4 py-3.5 items-center"
                      style={{ gridTemplateColumns: '48px 1fr 80px 60px 70px', borderBottom: i < qualData.results.length - 1 ? '1px solid var(--field-border)' : 'none', background: i < 3 ? 'color-mix(in srgb, var(--field-orange) 5%, transparent)' : 'transparent' }}>
                      <div><RankBadge rank={i + 1} /></div>
                      <div className="font-heading font-bold text-base" style={{ color: 'var(--field-text)', letterSpacing: '0.03em' }}>
                        {(qualData.is_team_category ? r.team_name : r.climber_name)?.toUpperCase()}
                      </div>
                      <div className="text-right font-mono font-bold text-base" style={{ color: i < 3 ? 'var(--field-orange)' : 'var(--field-text)' }}>{r.total_points}</div>
                      <div className="text-right font-mono text-sm" style={{ color: 'var(--field-text)' }}>{r.total_tops}</div>
                      <div className="text-right font-mono text-sm" style={{ color: 'var(--field-muted)' }}>{r.total_attempts}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!qualData && (
              <div className="text-center py-16" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                SELECT A CATEGORY ABOVE
              </div>
            )}
          </div>
        )}

        {/* ── FINALS ──────────────────────────────────────────────────── */}
        {tab === 'finals' && (
          <div>
            {finalsData.length === 0 ? (
              <div className="text-center py-16" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                NO FINALS RESULTS YET
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--field-border)', background: 'var(--field-surface)' }}>
                <div className="grid px-4 py-2.5 text-xs font-semibold uppercase tracking-widest"
                  style={{ gridTemplateColumns: '48px 1fr 120px 80px 60px 60px', borderBottom: '1px solid var(--field-border)', color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>#</span><span>ATHLETE</span><span>CATEGORY</span>
                  <span className="text-right">SCORE</span><span className="text-right">TOPS</span><span className="text-right">ZONES</span>
                </div>
                {finalsData.map((r, i) => (
                  <div key={r.climberId} className="grid px-4 py-3.5 items-center"
                    style={{ gridTemplateColumns: '48px 1fr 120px 80px 60px 60px', borderBottom: i < finalsData.length - 1 ? '1px solid var(--field-border)' : 'none', background: r.rank <= 3 ? 'color-mix(in srgb, var(--field-orange) 5%, transparent)' : 'transparent' }}>
                    <div><RankBadge rank={r.rank} /></div>
                    <div className="font-heading font-bold text-base" style={{ color: 'var(--field-text)', letterSpacing: '0.03em' }}>{r.name.toUpperCase()}</div>
                    <div className="text-xs" style={{ color: 'var(--field-muted)', fontFamily: 'var(--font-mono)' }}>{r.category.toUpperCase()}</div>
                    <div className="text-right font-mono font-bold text-lg" style={{ color: r.rank <= 3 ? 'var(--field-orange)' : 'var(--field-text)' }}>{r.score.toFixed(1)}</div>
                    <div className="text-right font-mono text-sm" style={{ color: 'var(--field-text)' }}>{r.topCount}</div>
                    <div className="text-right font-mono text-sm" style={{ color: 'var(--field-muted)' }}>{r.zoneCount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
