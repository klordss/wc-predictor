import type { GroupEntry, Match, MatchScore } from '../types'
import { matchesForGroup, teamsInGroupOrder } from './fixtures'
import { computeStandings } from './standings'

export function qualifierKey(groupLetter: string, team: string): string {
  return `${groupLetter}:${team}`
}

export function allGroupsFullyScored(
  groups: GroupEntry[],
  fixtures: Match[],
  scores: Record<string, MatchScore | undefined>,
): boolean {
  for (const g of groups) {
    const ms = matchesForGroup(fixtures, g.group)
    if (ms.some((m) => scores[m.id] === undefined)) return false
  }
  return true
}

type ThirdCand = { key: string; pts: number; gd: number; gf: number }

function collectThirdPlaceCandidates(
  groups: GroupEntry[],
  fixtures: Match[],
  scores: Record<string, MatchScore | undefined>,
): ThirdCand[] {
  const candidates: ThirdCand[] = []
  for (const g of groups) {
    const letter = g.group
    const teamList = teamsInGroupOrder(g)
    const ms = matchesForGroup(fixtures, letter)
    if (ms.some((m) => scores[m.id] === undefined)) continue
    const standings = computeStandings(teamList, ms, scores)
    const third = standings[2]
    if (!third) continue
    candidates.push({
      key: qualifierKey(letter, third.team),
      pts: third.pts,
      gd: third.gd,
      gf: third.gf,
    })
  }
  candidates.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.key.localeCompare(b.key)
  })
  return candidates
}

/** How many third-place sides are in the “qualifying pool” for UI and knockout assignment. */
export function provisionalThirdPoolSize(
  numCandidates: number,
  allGroupsComplete: boolean,
): number {
  if (numCandidates === 0) return 0
  if (allGroupsComplete) return Math.min(8, numCandidates)
  if (numCandidates <= 8) return numCandidates
  return 8
}

/**
 * Third-place teams from finished groups only, ranked Pts → GD → GF.
 * While the group stage is open and more than eight thirds are known, only the current top eight are treated as
 * qualifiers; once every group is done, the final eight are fixed.
 */
export function computeThirdBestQualifierKeys(
  groups: GroupEntry[],
  fixtures: Match[],
  scores: Record<string, MatchScore | undefined>,
  groupsComplete?: boolean,
): Set<string> {
  const candidates = collectThirdPlaceCandidates(groups, fixtures, scores)
  if (candidates.length === 0) return new Set()
  const allDone = groupsComplete ?? allGroupsFullyScored(groups, fixtures, scores)
  const take = provisionalThirdPoolSize(candidates.length, allDone)
  return new Set(candidates.slice(0, take).map((c) => c.key))
}

export type RankedThird = {
  rank: number
  group: string
  team: string
  key: string
  pts: number
  gd: number
  gf: number
}

/**
 * Ranked pool used for knockout third slots (same cut as {@link computeThirdBestQualifierKeys}).
 * Updates whenever another group is finished.
 */
export function getRankedBestThirdPlaces(
  groups: GroupEntry[],
  fixtures: Match[],
  scores: Record<string, MatchScore | undefined>,
  groupsComplete?: boolean,
): RankedThird[] {
  type Cand = { key: string; group: string; team: string; pts: number; gd: number; gf: number }
  const candidates: Cand[] = []

  for (const g of groups) {
    const letter = g.group
    const teamList = teamsInGroupOrder(g)
    const ms = matchesForGroup(fixtures, letter)
    if (ms.some((m) => scores[m.id] === undefined)) continue
    const standings = computeStandings(teamList, ms, scores)
    const third = standings[2]
    if (!third) continue
    candidates.push({
      key: qualifierKey(letter, third.team),
      group: letter,
      team: third.team,
      pts: third.pts,
      gd: third.gd,
      gf: third.gf,
    })
  }

  candidates.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.key.localeCompare(b.key)
  })

  const allDone = groupsComplete ?? allGroupsFullyScored(groups, fixtures, scores)
  const take = provisionalThirdPoolSize(candidates.length, allDone)
  return candidates.slice(0, take).map((c, i) => ({
    rank: i + 1,
    group: c.group,
    team: c.team,
    key: c.key,
    pts: c.pts,
    gd: c.gd,
    gf: c.gf,
  }))
}

export type ThirdPlaceTableRow = {
  group: string
  team: string | null
  pts: number | null
  gd: number | null
  gf: number | null
  /** 1 = best third among finished groups; null while that group is still open. */
  position: number | null
  /** In the current eight (or full provisional pool when fewer than nine groups are done). */
  qualifies: boolean
  /** Group stage not fully scored for this letter. */
  pending: boolean
  /** Among known thirds only: outside the current top eight while the group stage is still open. */
  provisionalOut: boolean
}

/**
 * Twelve group rows: finished groups first, sorted best third → worst (Pts, GD, GF); open groups last (A–L).
 * Qualifiers match {@link computeThirdBestQualifierKeys}.
 */
export function getThirdPlaceTableRows(
  groups: GroupEntry[],
  fixtures: Match[],
  scores: Record<string, MatchScore | undefined>,
  groupsComplete?: boolean,
): ThirdPlaceTableRow[] {
  const allDone = groupsComplete ?? allGroupsFullyScored(groups, fixtures, scores)
  type Acc = ThirdPlaceTableRow & { sortKey: string }
  const complete: Acc[] = []
  const pending: ThirdPlaceTableRow[] = []

  for (const g of groups) {
    const letter = g.group
    const teamList = teamsInGroupOrder(g)
    const ms = matchesForGroup(fixtures, letter)
    if (ms.some((m) => scores[m.id] === undefined)) {
      pending.push({
        group: letter,
        team: null,
        pts: null,
        gd: null,
        gf: null,
        position: null,
        qualifies: false,
        pending: true,
        provisionalOut: false,
      })
      continue
    }
    const standings = computeStandings(teamList, ms, scores)
    const third = standings[2]
    if (!third) {
      pending.push({
        group: letter,
        team: null,
        pts: null,
        gd: null,
        gf: null,
        position: null,
        qualifies: false,
        pending: true,
        provisionalOut: false,
      })
      continue
    }
    complete.push({
      group: letter,
      team: third.team,
      pts: third.pts,
      gd: third.gd,
      gf: third.gf,
      position: 0,
      qualifies: false,
      pending: false,
      provisionalOut: false,
      sortKey: qualifierKey(letter, third.team),
    })
  }

  complete.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.sortKey.localeCompare(b.sortKey)
  })

  const take = provisionalThirdPoolSize(complete.length, allDone)
  const nComplete = complete.length
  const stripped: ThirdPlaceTableRow[] = complete.map((row, i) => {
    const { sortKey: _s, ...rest } = row
    const qualifies = i < take
    const provisionalOut = !allDone && nComplete >= 8 && !qualifies
    return {
      ...rest,
      position: i + 1,
      qualifies,
      provisionalOut,
    }
  })

  pending.sort((a, b) => a.group.localeCompare(b.group))
  return [...stripped, ...pending]
}
