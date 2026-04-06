import { useCallback, useEffect, useState } from 'react'
import type { MatchScore } from '../types'

const STORAGE_KEY = 'wc-predictor-2026-knockout'

export type KnockoutScoresMap = Record<string, MatchScore | undefined>

/** In-progress home/away strings so inputs are not cleared while typing. */
export type KoInputDrafts = Record<string, { h: string; a: string }>

type PersistedV2 = {
  scores: KnockoutScoresMap
  drafts: KoInputDrafts
}

function sanitizeScores(raw: unknown): KnockoutScoresMap {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const out: KnockoutScoresMap = {}
  for (const [k, v] of Object.entries(raw)) {
    if (
      v &&
      typeof v === 'object' &&
      'home' in v &&
      'away' in v &&
      typeof (v as MatchScore).home === 'number' &&
      typeof (v as MatchScore).away === 'number'
    ) {
      const s = v as MatchScore
      if (Number.isInteger(s.home) && Number.isInteger(s.away) && s.home >= 0 && s.away >= 0) {
        out[k] = { home: s.home, away: s.away }
      }
    }
  }
  return out
}

function sanitizeDrafts(raw: unknown): KoInputDrafts {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const out: KoInputDrafts = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v && typeof v === 'object' && 'h' in v && 'a' in v) {
      const h = String((v as { h: unknown }).h)
      const a = String((v as { a: unknown }).a)
      out[k] = { h, a }
    }
  }
  return out
}

function loadPersisted(): { scores: KnockoutScoresMap; drafts: KoInputDrafts } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { scores: {}, drafts: {} }
    const data = JSON.parse(raw) as unknown
    if (data && typeof data === 'object' && !Array.isArray(data) && 'scores' in data) {
      const p = data as PersistedV2
      return {
        scores: sanitizeScores(p.scores),
        drafts: sanitizeDrafts(p.drafts),
      }
    }
    return { scores: sanitizeScores(data), drafts: {} }
  } catch {
    return { scores: {}, drafts: {} }
  }
}

export function useKnockoutScores() {
  const initial = loadPersisted()
  const [koScores, setKoScores] = useState<KnockoutScoresMap>(initial.scores)
  const [koDrafts, setKoDrafts] = useState<KoInputDrafts>(initial.drafts)
  const [koRevision, setKoRevision] = useState(0)

  useEffect(() => {
    const payload: PersistedV2 = { scores: koScores, drafts: koDrafts }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [koScores, koDrafts])

  const setKoScore = useCallback((matchId: string, home: string, away: string) => {
    const parse = (s: string): number | undefined => {
      const t = s.trim()
      if (t === '') return undefined
      if (!/^\d+$/.test(t)) return undefined
      const n = Number(t)
      return Number.isFinite(n) ? n : undefined
    }

    const h = parse(home)
    const a = parse(away)
    const homeEmpty = home.trim() === ''
    const awayEmpty = away.trim() === ''

    setKoDrafts((prev) => {
      if (homeEmpty && awayEmpty) {
        const next = { ...prev }
        delete next[matchId]
        return next
      }
      return { ...prev, [matchId]: { h: home, a: away } }
    })

    setKoScores((prev) => {
      const next = { ...prev }
      if (h !== undefined && a !== undefined) {
        next[matchId] = { home: h, away: a }
      } else {
        delete next[matchId]
      }
      return next
    })
  }, [])

  const resetKnockout = useCallback(() => {
    setKoScores({})
    setKoDrafts({})
    setKoRevision((r) => r + 1)
  }, [])

  return { koScores, koDrafts, koRevision, setKoScore, resetKnockout }
}
