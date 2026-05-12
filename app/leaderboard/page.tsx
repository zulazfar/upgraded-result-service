'use client'

import { useEffect, useState, useCallback } from 'react'

interface Category { category_id: number; category_name: string }
interface QualResult { climber_id?: string; climber_name?: string; team_name?: string; total_points: number; total_tops: number; total_attempts: number }
interface FinalsResult { rank: number; climberId: string; name: string; category: string; score: number; topCount: number; zoneCount: number; attemptsToTop: number; attemptsToZone: number }

const MEDAL = ['🥇', '🥈', '🥉']

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) return <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{MEDAL[rank - 1]}</span>
  return (
    <span className="font-bold text-sm tabular-nums"
      style={{ color: 'var(--field-muted)', minWidth: 28, display: 'inline-block', textAlign: 'center' }}>
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
    <div className="field-page" style={{ fontFamily: 'inherit' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        boxShadow: '0 1px 0 rgba(17,24,39,0.06), 0 4px 16px rgba(17,24,39,0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between" style={{ height: '56px' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg"
                style={{ background: 'var(--field-orange)', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 10 L6 2 L10 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="font-bold text-base leading-none" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
                  Leaderboard
                </div>
                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--field-muted)' }}>
                  Live results
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--field-muted)' }}>
                {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <button onClick={refresh}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: 'var(--field-raised)',
                  color: 'var(--field-text)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                Refresh
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 pb-0">
            {(['qualifiers', 'finals'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-5 py-2.5 text-sm font-semibold capitalize relative"
                style={{
                  color: tab === t ? 'var(--field-orange)' : 'var(--field-muted)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                {t}
                {tab === t && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t-sm"
                    style={{ background: 'var(--field-orange)' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── QUALIFIERS ───────────────────────────────────────────────── */}
        {tab === 'qualifiers' && (
          <div className="space-y-5">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map(c => {
                const active = categoryId === String(c.category_id)
                return (
                  <button key={c.category_id} onClick={() => loadCategory(String(c.category_id))}
                    className="px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{
                      background: active ? 'var(--field-orange)' : '#fff',
                      color: active ? '#fff' : 'var(--field-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: active
                        ? '0 4px 14px rgba(37,99,235,0.35), 0 1px 3px rgba(37,99,235,0.2)'
                        : 'var(--shadow-sm)',
                      transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}>
                    {c.category_name}
                  </button>
                )
              })}
            </div>

            {qualData && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-bold text-xl" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
                    {qualData.category_name}
                  </h2>
                  {qualData.is_team_category && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'var(--field-raised)', color: 'var(--field-muted)' }}>
                      Team
                    </span>
                  )}
                  <span className="text-sm" style={{ color: 'var(--field-muted)' }}>
                    {qualData.results.length} {qualData.is_team_category ? 'teams' : 'athletes'}
                  </span>
                </div>

                {/* Table */}
                <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                  {/* Header */}
                  <div className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{
                      gridTemplateColumns: '48px 1fr 72px 56px 64px',
                      background: 'var(--field-raised)',
                      color: 'var(--field-muted)',
                    }}>
                    <span>#</span>
                    <span>{qualData.is_team_category ? 'Team' : 'Athlete'}</span>
                    <span className="text-right">Pts</span>
                    <span className="text-right">Tops</span>
                    <span className="text-right">Att</span>
                  </div>
                  {/* Rows */}
                  {qualData.results.map((r, i) => (
                    <div key={i} className="grid px-5 items-center"
                      style={{
                        gridTemplateColumns: '48px 1fr 72px 56px 64px',
                        paddingTop: '14px',
                        paddingBottom: '14px',
                        borderTop: '1px solid rgba(17,24,39,0.05)',
                        background: i === 0 ? 'oklch(0.98 0.04 85)'
                          : i === 1 ? 'oklch(0.985 0.008 0)'
                          : i === 2 ? 'oklch(0.98 0.03 55)'
                          : '#fff',
                      }}>
                      <div><RankBadge rank={i + 1} /></div>
                      <div className="font-semibold text-base" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>
                        {qualData.is_team_category ? r.team_name : r.climber_name}
                      </div>
                      <div className="text-right font-bold text-base tabular-nums"
                        style={{ color: i < 3 ? 'var(--field-orange)' : 'var(--field-text)' }}>
                        {r.total_points}
                      </div>
                      <div className="text-right text-sm tabular-nums font-medium" style={{ color: 'var(--field-text)' }}>
                        {r.total_tops}
                      </div>
                      <div className="text-right text-sm tabular-nums" style={{ color: 'var(--field-muted)' }}>
                        {r.total_attempts}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!qualData && (
              <div className="text-center py-20 text-sm font-medium" style={{ color: 'var(--field-muted)' }}>
                Select a category above
              </div>
            )}
          </div>
        )}

        {/* ── FINALS ───────────────────────────────────────────────────── */}
        {tab === 'finals' && (
          <div>
            {finalsData.length === 0 ? (
              <div className="text-center py-20 text-sm font-medium" style={{ color: 'var(--field-muted)' }}>
                No finals results yet
              </div>
            ) : (
              <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                {/* Header */}
                <div className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{
                    gridTemplateColumns: '48px 1fr 120px 80px 56px 56px',
                    background: 'var(--field-raised)',
                    color: 'var(--field-muted)',
                  }}>
                  <span>#</span>
                  <span>Athlete</span>
                  <span>Category</span>
                  <span className="text-right">Score</span>
                  <span className="text-right">Tops</span>
                  <span className="text-right">Zones</span>
                </div>
                {/* Rows */}
                {finalsData.map((r, i) => (
                  <div key={r.climberId} className="grid px-5 items-center"
                    style={{
                      gridTemplateColumns: '48px 1fr 120px 80px 56px 56px',
                      paddingTop: '14px',
                      paddingBottom: '14px',
                      borderTop: '1px solid rgba(17,24,39,0.05)',
                      background: r.rank === 1 ? 'oklch(0.98 0.04 85)'
                        : r.rank === 2 ? 'oklch(0.985 0.008 0)'
                        : r.rank === 3 ? 'oklch(0.98 0.03 55)'
                        : '#fff',
                    }}>
                    <div><RankBadge rank={r.rank} /></div>
                    <div className="font-semibold text-base" style={{ color: 'var(--field-text)', letterSpacing: '-0.01em' }}>{r.name}</div>
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--field-raised)', color: 'var(--field-muted)' }}>
                        {r.category}
                      </span>
                    </div>
                    <div className="text-right font-bold text-lg tabular-nums"
                      style={{ color: r.rank <= 3 ? 'var(--field-orange)' : 'var(--field-text)' }}>
                      {r.score.toFixed(1)}
                    </div>
                    <div className="text-right text-sm tabular-nums font-medium" style={{ color: 'var(--field-text)' }}>{r.topCount}</div>
                    <div className="text-right text-sm tabular-nums" style={{ color: 'var(--field-muted)' }}>{r.zoneCount}</div>
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
