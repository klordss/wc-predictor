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

function scoreValue(team: string, key: 'pts' | 'gd' | 'gf', map: Map<string, Agg>): number {
  const s = map.get(team)
  if (!s) return 0
  return s[key]
}

function matchesWithin(teams: string[], matches: Match[]): Match[] {
  return matches.filter((m) => teams.includes(m.home) && teams.includes(m.away))
}

function orderByCriteria(
  teams: string[],
  groupMatches: Match[],
  scores: Record<string, MatchScore | undefined>,
  overall: Map<string, Agg>,
  criterionIndex: number,
): string[] {
  if (teams.length <= 1) return [...teams]

  // 0-2: head-to-head for this exact tied subset (recomputed on every tie stage)
  // 3-4: overall group stats
  // 5: deterministic fallback (name)
  if (criterionIndex >= 5) return [...teams].sort((a, b) => a.localeCompare(b))

  let currentStats: Map<string, Agg>
  let metric: 'pts' | 'gd' | 'gf'

  if (criterionIndex <= 2) {
    const internal = matchesWithin(teams, groupMatches)
    currentStats = aggregateStats(teams, internal, scores)
    metric = criterionIndex === 0 ? 'pts' : criterionIndex === 1 ? 'gd' : 'gf'
  } else {
    currentStats = overall
    metric = criterionIndex === 3 ? 'gd' : 'gf'
  }

  const sorted = [...teams].sort((a, b) => {
    const diff = scoreValue(b, metric, currentStats) - scoreValue(a, metric, currentStats)
    if (diff !== 0) return diff
    return a.localeCompare(b)
  })

  const out: string[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i + 1
    const value = scoreValue(sorted[i], metric, currentStats)
    while (j < sorted.length && scoreValue(sorted[j], metric, currentStats) === value) j += 1
    const block = sorted.slice(i, j)
    if (block.length === 1) {
      out.push(block[0])
    } else {
      out.push(...orderByCriteria(block, groupMatches, scores, overall, criterionIndex + 1))
    }
    i = j
  }
  return out
}

/**
 * Order within a group:
 * 1) overall points
 * 2) head-to-head points among tied teams
 * 3) head-to-head goal difference among tied teams
 * 4) head-to-head goals scored among tied teams
 * 5) overall goal difference
 * 6) overall goals scored
 * 7) name as deterministic fallback for unresolved ties
 */
export function orderTeamsInGroup(
  teams: string[],
  relevantMatches: Match[],
  scores: Record<string, MatchScore | undefined>,
): string[] {
  if (teams.length <= 1) return [...teams]

  const overall = aggregateStats(teams, relevantMatches, scores)
  const byPoints = [...teams].sort((a, b) => {
    const diff = scoreValue(b, 'pts', overall) - scoreValue(a, 'pts', overall)
    if (diff !== 0) return diff
    return a.localeCompare(b)
  })

  const out: string[] = []
  let i = 0
  while (i < byPoints.length) {
    let j = i + 1
    const points = scoreValue(byPoints[i], 'pts', overall)
    while (j < byPoints.length && scoreValue(byPoints[j], 'pts', overall) === points) {
      j += 1
    }

    const block = byPoints.slice(i, j)
    if (block.length === 1) {
      out.push(block[0])
    } else {
      out.push(...orderByCriteria(block, relevantMatches, scores, overall, 0))
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
