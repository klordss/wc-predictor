export type ScheduledPair = {
  home: string
  away: string
  /** ISO date YYYY-MM-DD from the official schedule */
  date?: string
  venue?: string
  /** Kickoff in US Central Time (Texas), ISO 8601 with offset (CDT −05:00 in June). */
  kickoffCt?: string
}

export type MatchdayBlock = {
  matchday: number
  matches: ScheduledPair[]
}

export type GroupEntry = {
  group: string
  matchdays: MatchdayBlock[]
}

export type Match = {
  id: string
  group: string
  home: string
  away: string
  matchday: number
  date?: string
  venue?: string
  kickoffCt?: string
}

export type MatchScore = {
  home: number
  away: number
  /** Knockout-only tiebreaker when regulation score is level. */
  penHome?: number
  penAway?: number
}

export type StandingRow = {
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
}
