import { useEffect, useMemo, useRef, useState } from 'react'
import type { Match } from '../types'
import type { ScoresMap } from '../hooks/usePredictions'
import { TeamWithFlag } from './TeamWithFlag'

type Props = {
  matches: Match[]
  scores: ScoresMap
  onScoreChange: (matchId: string, home: string, away: string) => void
}

function atNoonUtc(ymd: string): Date {
  return new Date(`${ymd}T12:00:00Z`)
}

/** One matchday line: single date with weekday, or a compact range across days. */
function formatMatchdayDateLine(matches: Match[]): string | null {
  const dates = [...new Set(matches.map((m) => m.date).filter((d): d is string => Boolean(d)))].sort()
  if (dates.length === 0) return null
  if (dates.length === 1) {
    const d = atNoonUtc(dates[0])
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }
  const a = atNoonUtc(dates[0])
  const b = atNoonUtc(dates[dates.length - 1])
  const y = a.getUTCFullYear()
  const sameYear = y === b.getUTCFullYear()
  const sameMonth = sameYear && a.getUTCMonth() === b.getUTCMonth()
  const optsDay: Intl.DateTimeFormatOptions = { day: 'numeric' }
  const optsMon: Intl.DateTimeFormatOptions = { month: 'short' }
  const optsWd: Intl.DateTimeFormatOptions = { weekday: 'short' }
  const optsYear: Intl.DateTimeFormatOptions = { year: 'numeric' }
  if (sameMonth && sameYear) {
    const mon = a.toLocaleDateString(undefined, { month: 'long' })
    const d1 = a.toLocaleDateString(undefined, { day: 'numeric' })
    const d2 = b.toLocaleDateString(undefined, { day: 'numeric' })
    return `${d1}–${d2} ${mon} ${y}`
  }
  const left = a.toLocaleDateString(undefined, { ...optsWd, ...optsDay, ...optsMon, ...(sameYear ? {} : optsYear) })
  const right = b.toLocaleDateString(undefined, { ...optsWd, ...optsDay, ...optsMon, ...optsYear })
  return `${left} – ${right}`
}

/** Short date on the venue strip when the matchday spans more than one calendar day. */
function formatMatchChipDate(ymd: string): string {
  const d = atNoonUtc(ymd)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
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
  /** Row that contains a focused score input; drives highlight so it matches what the user is editing. */
  const [focusedMatchId, setFocusedMatchId] = useState<string | null>(null)
  const prevScoresRef = useRef<ScoresMap | null>(null)

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

  const matchesInDisplayOrder = useMemo(
    () => matchdaysOrdered.flatMap(([, list]) => list),
    [matchdaysOrdered],
  )

  /** After both goals are entered, move focus to the next open fixture in list order. */
  useEffect(() => {
    if (prevScoresRef.current === null) {
      prevScoresRef.current = scores
      return
    }
    const prev = prevScoresRef.current
    prevScoresRef.current = scores

    let justCompletedId: string | null = null
    for (const m of matchesInDisplayOrder) {
      if (scores[m.id] !== undefined && prev[m.id] === undefined) {
        justCompletedId = m.id
        break
      }
    }
    if (justCompletedId === null) return

    const idx = matchesInDisplayOrder.findIndex((m) => m.id === justCompletedId)
    if (idx < 0) return
    const next = matchesInDisplayOrder.slice(idx + 1).find((m) => scores[m.id] === undefined)
    if (!next) return

    requestAnimationFrame(() => {
      document.getElementById(`${next.id}-home`)?.focus()
    })
  }, [scores, matchesInDisplayOrder])

  const renderRow = (m: Match, matchdayMatches: Match[]) => {
    const d = drafts[m.id] ?? { home: '', away: '' }
    const isActiveRow =
      focusedMatchId === m.id || (focusedMatchId === null && m.id === firstIncompleteId)
    const isHighlight = isActiveRow
    const distinctDates = new Set(
      matchdayMatches.map((x) => x.date).filter((x): x is string => Boolean(x)),
    )
    const showChipDate = Boolean(m.date) && distinctDates.size > 1

    return (
      <div
        key={m.id}
        className={`fixture-row${isHighlight ? ' fixture-row--highlight' : ''}`}
        role="listitem"
        onFocus={() => setFocusedMatchId(m.id)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setFocusedMatchId(null)
          }
        }}
      >
        {m.venue || showChipDate ? (
          <div
            className={`fixture-row__venue${showChipDate && !m.venue ? ' fixture-row__venue--dateonly' : ''}`}
            aria-label={m.venue ? `Venue: ${m.venue}` : undefined}
          >
            {m.venue ? <span className="fixture-row__venue-stadium">{m.venue}</span> : null}
            {showChipDate && m.date ? (
              <time className="fixture-row__venue-date" dateTime={m.date}>
                {formatMatchChipDate(m.date)}
              </time>
            ) : null}
          </div>
        ) : null}
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
      </div>
    )
  }

  return (
    <div className="fixtures-by-matchday">
      {matchdaysOrdered.map(([day, list]) => {
        const dateLine = formatMatchdayDateLine(list)
        return (
          <section
            key={day}
            className="fixture-matchday-block"
            aria-labelledby={`matchday-${day}-heading`}
          >
            <header className="fixture-matchday__header">
              <h3 id={`matchday-${day}-heading`} className="fixture-matchday">
                Matchday {day}
              </h3>
              {dateLine ? <p className="fixture-matchday__dates">{dateLine}</p> : null}
            </header>
            <div className="fixtures-list" role="list">
              {list.map((m) => renderRow(m, list))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
