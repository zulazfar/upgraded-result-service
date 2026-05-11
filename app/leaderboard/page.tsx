'use client'

import { useEffect, useState, useCallback } from 'react'

interface Category { category_id: number; category_name: string }
interface QualResult { climber_id?: string; climber_name?: string; team_name?: string; total_points: number; total_tops: number; total_attempts: number }
interface FinalsResult { rank: number; climberId: string; name: string; category: string; score: number; topCount: number; zoneCount: number; attemptsToTop: number; attemptsToZone: number }

const MEDAL = ['🥇', '🥈', '🥉']

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) return <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{MEDAL[rank - 1]}</span>
  return (
    <span className="text-base font-bold" style={{ color: 'var(--field-muted)', minWidth: 28, display: 'inline-block', textAlign: 'center', fontFamily: 'inherit' }}>
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
              <div className="font-bold text-2xl leading-none" style={{ color: 'var(--field-text)' }}>Leaderboard</div>
              <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--field-muted)' }}>Live Results</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium" style={{ color: 'var(--field-muted)' }}>
              {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button onClick={refresh}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'var(--field-raised)', color: 'var(--field-text)', border: '1px solid var(--field-border)', cursor: 'pointer' }}>
              Refresh
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-4xl mx-auto px-4 flex" style={{ borderTop: '1px solid var(--field-border)' }}>
          {(['qualifiers', 'finals'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-6 py-3 text-sm font-semibold transition-all relative capitalize"
              style={{ color: tab === t ? 'var(--field-orange)' : 'var(--field-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
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
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: categoryId === String(c.category_id) ? 'var(--field-orange)' : 'var(--field-surface)',
                    border: `1px solid ${categoryId === String(c.category_id) ? 'var(--field-orange)' : 'var(--field-border)'}`,
                    color: categoryId === String(c.category_id) ? '#fff' : 'var(--field-muted)',
                    cursor: 'pointer',
                    boxShadow: categoryId === String(c.category_id) ? '0 4px 12px color-mix(in srgb, var(--field-orange) 30%, transparent)' : 'none',
                  }}>
                  {c.category_name}
                </button>
              ))}
            </div>

            {qualData && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-bold text-xl" style={{ color: 'var(--field-text)' }}>
                    {qualData.category_name}
                  </h2>
                  {qualData.is_team_category && (
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'var(--field-raised)', color: 'var(--field-muted)', border: '1px solid var(--field-border)' }}>Team</span>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--field-border)', background: 'var(--field-surface)' }}>
                  <div className="grid px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ gridTemplateColumns: '48px 1fr 80px 60px 70px', borderBottom: '1px solid var(--field-border)', color: 'var(--field-muted)' }}>
                    <span>#</span><span>{qualData.is_team_category ? 'Team' : 'Athlete'}</span>
                    <span className="text-right">Pts</span><span className="text-right">Tops</span><span className="text-right">Att</span>
                  </div>
                  {qualData.results.map((r, i) => (
                    <div key={i} className="grid px-4 py-3.5 items-center"
                      style={{ gridTemplateColumns: '48px 1fr 80px 60px 70px', borderBottom: i < qualData.results.length - 1 ? '1px solid var(--field-border)' : 'none', background: i === 0 ? 'oklch(0.98 0.04 85)' : i === 1 ? 'oklch(0.98 0.01 0)' : i === 2 ? 'oklch(0.98 0.03 55)' : 'transparent' }}>
                      <div><RankBadge rank={i + 1} /></div>
                      <div className="font-bold text-base" style={{ color: 'var(--field-text)' }}>
                        {qualData.is_team_category ? r.team_name : r.climber_name}
                      </div>
                      <div className="text-right font-bold text-base" style={{ color: i < 3 ? 'var(--field-orange)' : 'var(--field-text)' }}>{r.total_points}</div>
                      <div className="text-right text-sm" style={{ color: 'var(--field-text)' }}>{r.total_tops}</div>
                      <div className="text-right text-sm" style={{ color: 'var(--field-muted)' }}>{r.total_attempts}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!qualData && (
              <div className="text-center py-16 text-sm" style={{ color: 'var(--field-muted)' }}>
                Select a category above
              </div>
            )}
          </div>
        )}

        {/* ── FINALS ──────────────────────────────────────────────────── */}
        {tab === 'finals' && (
          <div>
            {finalsData.length === 0 ? (
              <div className="text-center py-16 text-sm" style={{ color: 'var(--field-muted)' }}>
                No finals results yet
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--field-border)', background: 'var(--field-surface)' }}>
                <div className="grid px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                  style={{ gridTemplateColumns: '48px 1fr 120px 80px 60px 60px', borderBottom: '1px solid var(--field-border)', color: 'var(--field-muted)' }}>
                  <span>#</span><span>Athlete</span><span>Category</span>
                  <span className="text-right">Score</span><span className="text-right">Tops</span><span className="text-right">Zones</span>
                </div>
                {finalsData.map((r, i) => (
                  <div key={r.climberId} className="grid px-4 py-3.5 items-center"
                    style={{ gridTemplateColumns: '48px 1fr 120px 80px 60px 60px', borderBottom: i < finalsData.length - 1 ? '1px solid var(--field-border)' : 'none', background: r.rank === 1 ? 'oklch(0.98 0.04 85)' : r.rank === 2 ? 'oklch(0.98 0.01 0)' : r.rank === 3 ? 'oklch(0.98 0.03 55)' : 'transparent' }}>
                    <div><RankBadge rank={r.rank} /></div>
                    <div className="font-bold text-base" style={{ color: 'var(--field-text)' }}>{r.name}</div>
                    <div className="text-xs font-medium" style={{ color: 'var(--field-muted)' }}>{r.category}</div>
                    <div className="text-right font-bold text-lg" style={{ color: r.rank <= 3 ? 'var(--field-orange)' : 'var(--field-text)' }}>{r.score.toFixed(1)}</div>
                    <div className="text-right text-sm" style={{ color: 'var(--field-text)' }}>{r.topCount}</div>
                    <div className="text-right text-sm" style={{ color: 'var(--field-muted)' }}>{r.zoneCount}</div>
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
