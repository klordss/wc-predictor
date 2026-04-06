export type ScheduledPair = {
  home: string
  away: string
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
}

export type MatchScore = {
  home: number
  away: number
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
