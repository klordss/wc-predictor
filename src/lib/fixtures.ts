import type { GroupEntry, Match } from '../types'

/** Slot order T0–T3 from matchday 1 (A vs B, C vs D). */
export function teamsInGroupOrder(g: GroupEntry): string[] {
  const md = g.matchdays[0]?.matches
  if (!md || md.length < 2) return []
  return [md[0].home, md[0].away, md[1].home, md[1].away]
}

export function generateFixtures(groups: GroupEntry[]): Match[] {
  const matches: Match[] = []
  for (const g of groups) {
    for (const md of g.matchdays) {
      for (const pair of md.matches) {
        matches.push({
          id: `${g.group}:${pair.home}:${pair.away}`,
          group: g.group,
          home: pair.home,
          away: pair.away,
          matchday: md.matchday,
        })
      }
    }
  }
  return matches
}

export function matchesForGroup(matches: Match[], group: string): Match[] {
  return matches.filter((m) => m.group === group)
}
