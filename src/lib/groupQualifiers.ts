import type { GroupEntry, Match, MatchScore } from '../types'
import { matchesForGroup, teamsInGroupOrder } from './fixtures'
import { computeStandings } from './standings'

export type GroupPodium = {
  first: string
  second: string
  third: string
}

/** Per group: podium once every fixture is scored; `null` while the group is still open. */
export type PartialGroupPodiums = Record<string, GroupPodium | null>

export function getPartialGroupPodiums(
  groups: GroupEntry[],
  fixtures: Match[],
  scores: Record<string, MatchScore | undefined>,
): PartialGroupPodiums {
  const out: PartialGroupPodiums = {}
  for (const g of groups) {
    const letter = g.group
    const teamList = teamsInGroupOrder(g)
    const ms = matchesForGroup(fixtures, letter)
    if (ms.some((m) => scores[m.id] === undefined)) {
      out[letter] = null
      continue
    }
    const st = computeStandings(teamList, ms, scores)
    const a = st[0]
    const b = st[1]
    const c = st[2]
    if (!a || !b || !c) {
      out[letter] = null
      continue
    }
    out[letter] = { first: a.team, second: b.team, third: c.team }
  }
  return out
}

/** @deprecated Prefer {@link getPartialGroupPodiums}; kept for callers that need an all-or-nothing snapshot. */
export function getGroupPodiums(
  groups: GroupEntry[],
  fixtures: Match[],
  scores: Record<string, MatchScore | undefined>,
): Record<string, GroupPodium> | null {
  const partial = getPartialGroupPodiums(groups, fixtures, scores)
  const letters = groups.map((g) => g.group)
  if (letters.some((L) => partial[L] === null)) return null
  const out: Record<string, GroupPodium> = {}
  for (const L of letters) {
    const p = partial[L]
    if (p) out[L] = p
  }
  return out
}
