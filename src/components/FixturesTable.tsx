import { useMemo, useState } from 'react'
import type { Match } from '../types'
import type { ScoresMap } from '../hooks/usePredictions'
import { TeamWithFlag } from './TeamWithFlag'

type Props = {
  matches: Match[]
  scores: ScoresMap
  onScoreChange: (matchId: string, home: string, away: string) => void
}

function buildDrafts(matches: Match[], scores: ScoresMap): Record<string, { home: string; away: string }> {
  const out: Record<string, { home: string; away: string }> = {}
  for (const m of matches) {
    const s = scores[m.id]
    out[m.id] = {
      home: s !== undefined ? String(s.home) : '',
      away: s !== undefined ? String(s.away) : '',
    }
  }
  return out
}

export function FixturesTable({ matches, scores, onScoreChange }: Props) {
  const [drafts, setDrafts] = useState(() => buildDrafts(matches, scores))

  const matchdaysOrdered = useMemo(() => {
    const map = new Map<number, Match[]>()
    for (const m of matches) {
      const d = m.matchday ?? 1
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(m)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [matches])

  const firstIncompleteId = useMemo(() => {
    const m = matches.find((x) => scores[x.id] === undefined)
    return m?.id ?? null
  }, [matches, scores])

  const focusHome = (matchId: string) => {
    document.getElementById(`${matchId}-home`)?.focus()
  }

  const renderRow = (m: Match) => {
    const d = drafts[m.id] ?? { home: '', away: '' }
    const hasScore = scores[m.id] !== undefined
    const isHighlight = m.id === firstIncompleteId
    const isPrimaryCta = isHighlight && !hasScore

    return (
      <div
        key={m.id}
        className={`fixture-row${isHighlight ? ' fixture-row--highlight' : ''}`}
        role="listitem"
      >
        <div className="fixture-row__main">
          <div className="fixture-row__team fixture-row__team--home">
            <TeamWithFlag name={m.home} />
          </div>
          <div className="fixture-row__scores" aria-label="Score">
            <label className="sr-only" htmlFor={`${m.id}-home`}>
              {m.home} goals
            </label>
            <input
              id={`${m.id}-home`}
              className="fixture-score-input"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              placeholder="—"
              value={d.home}
              onChange={(e) => {
                const home = e.target.value
                const away = d.away
                setDrafts((prev) => ({ ...prev, [m.id]: { home, away } }))
                onScoreChange(m.id, home, away)
              }}
            />
            <span className="fixture-row__colon" aria-hidden="true">
              :
            </span>
            <label className="sr-only" htmlFor={`${m.id}-away`}>
              {m.away} goals
            </label>
            <input
              id={`${m.id}-away`}
              className="fixture-score-input"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              placeholder="—"
              value={d.away}
              onChange={(e) => {
                const away = e.target.value
                const home = d.home
                setDrafts((prev) => ({ ...prev, [m.id]: { home, away } }))
                onScoreChange(m.id, home, away)
              }}
            />
          </div>
          <div className="fixture-row__team fixture-row__team--away">
            <TeamWithFlag name={m.away} />
          </div>
        </div>
        <button
          type="button"
          className={isPrimaryCta ? 'fixture-cta fixture-cta--primary' : 'fixture-cta fixture-cta--muted'}
          onClick={() => focusHome(m.id)}
        >
          {hasScore ? 'Enter score' : 'Predict'}
        </button>
      </div>
    )
  }

  return (
    <div className="fixtures-by-matchday">
      {matchdaysOrdered.map(([day, list]) => (
        <section
          key={day}
          className="fixture-matchday-block"
          aria-labelledby={`matchday-${day}-heading`}
        >
          <h3 id={`matchday-${day}-heading`} className="fixture-matchday">
            Matchday {day}
          </h3>
          <div className="fixtures-list" role="list">
            {list.map((m) => renderRow(m))}
          </div>
        </section>
      ))}
    </div>
  )
}
