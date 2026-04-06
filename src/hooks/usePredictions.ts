import { useCallback, useEffect, useState } from 'react'
import type { MatchScore } from '../types'

const STORAGE_KEY = 'wc-predictor-2026-scores'

export type ScoresMap = Record<string, MatchScore | undefined>

function loadScores(): ScoresMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw) as unknown
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {}
    const out: ScoresMap = {}
    for (const [k, v] of Object.entries(data)) {
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
  } catch {
    return {}
  }
}

export function usePredictions() {
  const [scores, setScores] = useState<ScoresMap>(loadScores)
  const [scoresRevision, setScoresRevision] = useState(0)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
  }, [scores])

  const setMatchScore = useCallback((matchId: string, home: string, away: string) => {
    const parse = (s: string): number | undefined => {
      const t = s.trim()
      if (t === '') return undefined
      if (!/^\d+$/.test(t)) return undefined
      const n = Number(t)
      return Number.isFinite(n) ? n : undefined
    }

    const h = parse(home)
    const a = parse(away)

    setScores((prev) => {
      const next = { ...prev }
      if (h === undefined || a === undefined) {
        delete next[matchId]
      } else {
        next[matchId] = { home: h, away: a }
      }
      return next
    })
  }, [])

  const clearGroupScores = useCallback((group: string, matchIds: string[]) => {
    const prefix = `${group}:`
    setScores((prev) => {
      const next = { ...prev }
      for (const id of matchIds) {
        if (id.startsWith(prefix)) delete next[id]
      }
      return next
    })
    setScoresRevision((r) => r + 1)
  }, [])

  const resetAllScores = useCallback(() => {
    setScores({})
    setScoresRevision((r) => r + 1)
  }, [])

  return { scores, scoresRevision, setMatchScore, clearGroupScores, resetAllScores }
}
