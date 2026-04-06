import type { Match, MatchScore, StandingRow } from '../types'

type Agg = {
  pts: number
  gf: number
  ga: number
  gd: number
  played: number
  won: number
  drawn: number
  lost: number
}

function aggregateStats(
  teamList: string[],
  matches: Match[],
  scores: Record<string, MatchScore | undefined>,
): Map<string, Agg> {
  const empty = (): Agg => ({
    pts: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
  })
  const map = new Map<string, Agg>()
  for (const t of teamList) map.set(t, empty())

  for (const m of matches) {
    if (!map.has(m.home) || !map.has(m.away)) continue
    const s = scores[m.id]
    if (s === undefined) continue

    const h = map.get(m.home)!
    const a = map.get(m.away)!

    h.played += 1
    a.played += 1
    h.gf += s.home
    h.ga += s.away
    a.gf += s.away
    a.ga += s.home

    if (s.home > s.away) {
      h.won += 1
      h.pts += 3
      a.lost += 1
    } else if (s.home < s.away) {
      a.won += 1
      a.pts += 3
      h.lost += 1
    } else {
      h.drawn += 1
      a.drawn += 1
      h.pts += 1
      a.pts += 1
    }
  }

  for (const st of map.values()) {
    st.gd = st.gf - st.ga
  }
  return map
}

function compareOverall(a: Pick<Agg, 'pts' | 'gd' | 'gf'>, b: Pick<Agg, 'pts' | 'gd' | 'gf'>): number {
  if (b.pts !== a.pts) return b.pts - a.pts
  if (b.gd !== a.gd) return b.gd - a.gd
  if (b.gf !== a.gf) return b.gf - a.gf
  return 0
}

function allSameOverall(block: string[], stats: Map<string, Agg>): boolean {
  if (block.length <= 1) return true
  const ref = stats.get(block[0])!
  return block.every((t) => compareOverall(stats.get(t)!, ref) === 0)
}

/**
 * FIFA-style order within a group: points → GD → GF → head-to-head among tied teams
 * (same mini-league rules), then name as a stand-in for fair play / drawing of lots.
 */
export function orderTeamsInGroup(
  teams: string[],
  relevantMatches: Match[],
  scores: Record<string, MatchScore | undefined>,
  depth = 0,
): string[] {
  if (teams.length <= 1) return [...teams]
  if (depth > 8) return [...teams].sort((a, b) => a.localeCompare(b))

  const stats = aggregateStats(teams, relevantMatches, scores)
  const sorted = [...teams].sort((t1, t2) => {
    const c = compareOverall(stats.get(t1)!, stats.get(t2)!)
    if (c !== 0) return c
    return t1.localeCompare(t2)
  })

  const out: string[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i + 1
    const si = stats.get(sorted[i])!
    while (j < sorted.length && compareOverall(si, stats.get(sorted[j])!) === 0) {
      j += 1
    }

    const block = sorted.slice(i, j)
    if (block.length === 1) {
      out.push(block[0])
    } else {
      const internal = relevantMatches.filter((m) => block.includes(m.home) && block.includes(m.away))
      const mini = aggregateStats(block, internal, scores)

      if (internal.length === 0 || allSameOverall(block, mini)) {
        out.push(...[...block].sort((a, b) => a.localeCompare(b)))
      } else {
        out.push(...orderTeamsInGroup(block, internal, scores, depth + 1))
      }
    }
    i = j
  }

  return out
}

export function computeStandings(
  teams: string[],
  groupMatches: Match[],
  scores: Record<string, MatchScore | undefined>,
): StandingRow[] {
  const stats = aggregateStats(teams, groupMatches, scores)
  const orderedNames = orderTeamsInGroup(teams, groupMatches, scores)

  const rows: StandingRow[] = orderedNames.map((team, index) => {
    const r = stats.get(team)!
    return {
      position: index + 1,
      team,
      played: r.played,
      won: r.won,
      drawn: r.drawn,
      lost: r.lost,
      gf: r.gf,
      ga: r.ga,
      gd: r.gd,
      pts: r.pts,
    }
  })

  return rows
}
