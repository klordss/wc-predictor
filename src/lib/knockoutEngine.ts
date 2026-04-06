import knockoutData from '../data/knockout2026.json'
import type { GroupPodium, PartialGroupPodiums } from './groupQualifiers'
import type { RankedThird } from './thirdPlace'
import type { MatchScore } from '../types'

/** FIFA label e.g. `3rd Group A/B/C/D/F` → eligible group letters for that bracket slot. */
function parseThirdEligibleGroups(label: string): string[] | null {
  if (!label.startsWith('3rd Group ')) return null
  const rest = label.slice('3rd Group '.length)
  if (!/^[A-L](?:\/[A-L])*$/.test(rest)) return null
  return rest.split('/')
}

export function koIdR32(n: number): string {
  return `ko:r32:${n}`
}
export function koIdR16(n: number): string {
  return `ko:r16:${n}`
}
export function koIdQf(n: number): string {
  return `ko:qf:${n}`
}
export function koIdSf(n: number): string {
  return `ko:sf:${n}`
}
export function koIdFinal(): string {
  return `ko:final:1`
}
export function koIdThird(): string {
  return `ko:tp:1`
}

export function winnerFromScore(
  score: MatchScore | undefined,
  home: string | null,
  away: string | null,
): string | null {
  if (!score || home === null || away === null) return null
  if (score.home > score.away) return home
  if (score.away > score.home) return away
  return null
}

export function loserFromScore(
  score: MatchScore | undefined,
  home: string | null,
  away: string | null,
): string | null {
  if (!score || home === null || away === null) return null
  if (score.home > score.away) return away
  if (score.away > score.home) return home
  return null
}

function podiumForLetter(podium: PartialGroupPodiums, letter: string): GroupPodium | null {
  return podium[letter] ?? null
}

type R32ThirdSlot = { match: number; eligible: string[] }

/** Every R32 tie that contains a `3rd Group …` label (FIFA uses eight such games). */
function collectR32ThirdSlots(
  rounds: { match: number; teamA: string; teamB: string }[],
): R32ThirdSlot[] {
  const sorted = [...rounds].sort((a, b) => a.match - b.match)
  const out: R32ThirdSlot[] = []
  for (const row of sorted) {
    for (const label of [row.teamA, row.teamB]) {
      const eligible = parseThirdEligibleGroups(label)
      if (eligible) out.push({ match: row.match, eligible })
    }
  }
  return out
}

/**
 * Assign each qualifying third to at most one R32 slot so every slot’s team is eligible for that slot.
 * Greedy “best rank first in match order” can leave a later slot empty (e.g. M82) after consuming A/E/I
 * earlier; this finds a maximum feasible matching (perfect when 8 thirds and 8 slots).
 */
export function assignThirdsToR32Slots(
  rankedThirds: RankedThird[],
  rounds: { match: number; teamA: string; teamB: string }[],
): Map<number, RankedThird> {
  const slots = collectR32ThirdSlots(rounds)
  const teams = rankedThirds
  if (slots.length === 0 || teams.length === 0) return new Map()

  let bestSize = 0
  let best = new Map<number, RankedThird>()

  function dfs(i: number, used: Set<string>, cur: Map<number, RankedThird>) {
    if (i === slots.length) {
      if (cur.size > bestSize) {
        bestSize = cur.size
        best = new Map(cur)
      }
      return
    }

    const { match, eligible } = slots[i]
    const el = new Set(eligible)

    dfs(i + 1, used, cur)

    for (const t of teams) {
      if (used.has(t.key)) continue
      if (!el.has(t.group)) continue
      used.add(t.key)
      cur.set(match, t)
      dfs(i + 1, used, cur)
      used.delete(t.key)
      cur.delete(match)
    }
  }

  dfs(0, new Set(), new Map())
  return best
}

function resolveR32Slot(
  label: string,
  matchNum: number,
  podium: PartialGroupPodiums,
  thirdByMatch: Map<number, RankedThird>,
): string | null {
  const m1 = label.match(/^Group ([A-L]) 1st$/)
  if (m1) return podiumForLetter(podium, m1[1])?.first ?? null

  const m2 = label.match(/^Group ([A-L]) 2nd$/)
  if (m2) return podiumForLetter(podium, m2[1])?.second ?? null

  const eligible = parseThirdEligibleGroups(label)
  if (eligible) {
    const t = thirdByMatch.get(matchNum)
    if (t && eligible.includes(t.group)) return t.team
    return null
  }

  return null
}

export type R32RowState = {
  id: string
  match: number
  /** FIFA schedule number (73–88) when known. */
  fifaMatch?: number
  labelHome: string
  labelAway: string
  home: string | null
  away: string | null
  winner: string | null
  score?: MatchScore
  isDraw: boolean
}

export function buildR32Rows(
  podium: PartialGroupPodiums,
  rankedThirds: RankedThird[],
  koScores: Record<string, MatchScore | undefined>,
): R32RowState[] {
  const rounds = [...knockoutData.roundOf32].sort((a, b) => a.match - b.match)
  const thirdByMatch = assignThirdsToR32Slots(rankedThirds, rounds)

  const rows: R32RowState[] = []
  for (const row of rounds) {
    const m = row.match
    const home = resolveR32Slot(row.teamA, m, podium, thirdByMatch)
    const away = resolveR32Slot(row.teamB, m, podium, thirdByMatch)
    const id = koIdR32(m)
    const score = koScores[id]
    const win = winnerFromScore(score, home, away)
    const isDraw = Boolean(score && home && away && score.home === score.away)
    const fifaMatch = 'fifaMatch' in row && typeof row.fifaMatch === 'number' ? row.fifaMatch : undefined
    rows.push({
      id,
      match: m,
      fifaMatch,
      labelHome: row.teamA,
      labelAway: row.teamB,
      home,
      away,
      winner: win,
      score,
      isDraw,
    })
  }
  return rows
}

function parseWn(label: string): number | null {
  const m = label.match(/^W(\d+)$/)
  return m ? Number(m[1]) : null
}

function parseR16Wn(label: string): number | null {
  const m = label.match(/^R16W(\d+)$/)
  return m ? Number(m[1]) : null
}

function parseQFn(label: string): number | null {
  const m = label.match(/^QF(\d+)$/)
  return m ? Number(m[1]) : null
}

function parseSFnWinner(label: string): number | null {
  const m = label.match(/^SF(\d+) Winner$/i)
  return m ? Number(m[1]) : null
}

function parseSFnLoser(label: string): number | null {
  const m = label.match(/^SF(\d+) Loser$/i)
  return m ? Number(m[1]) : null
}

export type KoRowState = {
  id: string
  round: string
  match: number
  labelHome: string
  labelAway: string
  home: string | null
  away: string | null
  winner: string | null
  score?: MatchScore
  isDraw: boolean
}

export function buildFullKnockoutState(
  podium: PartialGroupPodiums,
  rankedThirds: RankedThird[],
  koScores: Record<string, MatchScore | undefined>,
): {
  r32: R32RowState[]
  r16: KoRowState[]
  qf: KoRowState[]
  sf: KoRowState[]
  final: KoRowState
  third: KoRowState
} {
  const r32Rows = buildR32Rows(podium, rankedThirds, koScores)
  const r32W = (n: number) => r32Rows.find((r) => r.match === n)?.winner ?? null

  const r16Rows: KoRowState[] = knockoutData.roundOf16.map((row) => {
    const m = row.match
    const wa = parseWn(row.teamA)
    const wb = parseWn(row.teamB)
    const home = wa ? r32W(wa) : null
    const away = wb ? r32W(wb) : null
    const id = koIdR16(m)
    const score = koScores[id]
    const winner = winnerFromScore(score, home, away)
    const isDraw = Boolean(score && home && away && score.home === score.away)
    return {
      id,
      round: 'Round of 16',
      match: m,
      labelHome: row.teamA,
      labelAway: row.teamB,
      home,
      away,
      winner,
      score,
      isDraw,
    }
  })

  const r16W = (n: number) => r16Rows.find((r) => r.match === n)?.winner ?? null

  const qfRows: KoRowState[] = knockoutData.quarterFinals.map((row) => {
    const m = row.match
    const ha = parseR16Wn(row.teamA)
    const hb = parseR16Wn(row.teamB)
    const home = ha ? r16W(ha) : null
    const away = hb ? r16W(hb) : null
    const id = koIdQf(m)
    const score = koScores[id]
    const winner = winnerFromScore(score, home, away)
    const isDraw = Boolean(score && home && away && score.home === score.away)
    return {
      id,
      round: 'Quarter-finals',
      match: m,
      labelHome: row.teamA,
      labelAway: row.teamB,
      home,
      away,
      winner,
      score,
      isDraw,
    }
  })

  const qfW = (n: number) => qfRows.find((r) => r.match === n)?.winner ?? null

  const sfRows: KoRowState[] = knockoutData.semiFinals.map((row) => {
    const m = row.match
    const ha = parseQFn(row.teamA)
    const hb = parseQFn(row.teamB)
    const home = ha ? qfW(ha) : null
    const away = hb ? qfW(hb) : null
    const id = koIdSf(m)
    const score = koScores[id]
    const winner = winnerFromScore(score, home, away)
    const isDraw = Boolean(score && home && away && score.home === score.away)
    return {
      id,
      round: 'Semi-finals',
      match: m,
      labelHome: row.teamA,
      labelAway: row.teamB,
      home,
      away,
      winner,
      score,
      isDraw,
    }
  })

  const sfW = (n: number) => sfRows.find((r) => r.match === n)?.winner ?? null
  const sfL = (n: number) => {
    const s = sfRows.find((r) => r.match === n)
    if (!s?.score || !s.home || !s.away) return null
    return loserFromScore(s.score, s.home, s.away)
  }

  const f = knockoutData.final
  const fh = parseSFnWinner(f.teamA)
  const fa = parseSFnWinner(f.teamB)
  const finalHome = fh ? sfW(fh) : null
  const finalAway = fa ? sfW(fa) : null
  const finalId = koIdFinal()
  const finalScore = koScores[finalId]
  const finalWinner = winnerFromScore(finalScore, finalHome, finalAway)
  const finalRow: KoRowState = {
    id: finalId,
    round: 'Final',
    match: f.match,
    labelHome: f.teamA,
    labelAway: f.teamB,
    home: finalHome,
    away: finalAway,
    winner: finalWinner,
    score: finalScore,
    isDraw: Boolean(finalScore && finalHome && finalAway && finalScore.home === finalScore.away),
  }

  const t = knockoutData.thirdPlace
  const th = parseSFnLoser(t.teamA)
  const ta = parseSFnLoser(t.teamB)
  const thirdHome = th ? sfL(th) : null
  const thirdAway = ta ? sfL(ta) : null
  const thirdId = koIdThird()
  const thirdScore = koScores[thirdId]
  const thirdWinner = winnerFromScore(thirdScore, thirdHome, thirdAway)
  const thirdRow: KoRowState = {
    id: thirdId,
    round: 'Third place',
    match: t.match,
    labelHome: t.teamA,
    labelAway: t.teamB,
    home: thirdHome,
    away: thirdAway,
    winner: thirdWinner,
    score: thirdScore,
    isDraw: Boolean(thirdScore && thirdHome && thirdAway && thirdScore.home === thirdScore.away),
  }

  return { r32: r32Rows, r16: r16Rows, qf: qfRows, sf: sfRows, final: finalRow, third: thirdRow }
}
