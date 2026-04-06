import { useMemo } from 'react'
import type { KoInputDrafts } from '../hooks/useKnockoutScores'
import type { KoRowState, R32RowState } from '../lib/knockoutEngine'
import type { MatchScore } from '../types'
import { TeamWithFlag } from './TeamWithFlag'

type AnyKoRow = KoRowState | R32RowState

/** R32 leaf order → pairs that feed each R16 tie (left / right halves of the draw). */
const LEFT_R32_PAIRS: [number, number][] = [
  [1, 3],
  [2, 5],
  [11, 12],
  [9, 10],
]
const RIGHT_R32_PAIRS: [number, number][] = [
  [4, 6],
  [7, 8],
  [14, 16],
  [13, 15],
]

const LEFT_R16 = [1, 2, 5, 6] as const
const RIGHT_R16 = [3, 4, 7, 8] as const
const LEFT_QF = [1, 2] as const
const RIGHT_QF = [3, 4] as const

function bracketInputValues(
  row: AnyKoRow,
  koScores: Record<string, MatchScore | undefined>,
  koDrafts: KoInputDrafts,
): { h: string; a: string } {
  const d = koDrafts[row.id]
  if (d) return { h: d.h, a: d.a }
  const s = koScores[row.id]
  if (s !== undefined) return { h: String(s.home), a: String(s.away) }
  return { h: '', a: '' }
}

function BracketSlot({
  team,
  label,
  compact,
}: {
  team: string | null
  label: string
  compact?: boolean
}) {
  if (team) {
    return (
      <div className={`ko-bracket-slot${compact ? ' ko-bracket-slot--compact' : ''}`}>
        <TeamWithFlag name={team} />
      </div>
    )
  }
  return (
    <div className={`ko-bracket-slot ko-bracket-slot--empty${compact ? ' ko-bracket-slot--compact' : ''}`}>
      <span className="ko-bracket-slot__ph">{label}</span>
    </div>
  )
}

function BracketMatchCard({
  row,
  koScores,
  koDrafts,
  setKoScore,
  size = 'md',
}: {
  row: AnyKoRow
  koScores: Record<string, MatchScore | undefined>
  koDrafts: KoInputDrafts
  setKoScore: (id: string, home: string, away: string) => void
  size?: 'sm' | 'md'
}) {
  const { h, a } = bracketInputValues(row, koScores, koDrafts)
  const meta = (() => {
    if ('fifaMatch' in row && row.fifaMatch != null) return `${row.fifaMatch}`
    if ('round' in row) {
      const r = row.round
      if (r === 'Round of 16') return `16·${row.match}`
      if (r === 'Quarter-finals') return `QF${row.match}`
      if (r === 'Semi-finals') return `SF${row.match}`
      if (r === 'Final') return 'F'
      if (r === 'Third place') return '3rd'
    }
    return `${row.match}`
  })()

  return (
    <div className={`ko-bracket-card ko-bracket-card--${size}`}>
      <div className="ko-bracket-card__meta">{meta}</div>
      <div className="ko-bracket-card__teams">
        <BracketSlot team={row.home} label={row.labelHome} compact={size === 'sm'} />
        <div className="ko-bracket-card__scores">
          <input
            className="ko-bracket-score"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            aria-label={`${row.labelHome} goals`}
            value={h}
            onChange={(e) => {
              const home = e.target.value
              setKoScore(row.id, home, a)
            }}
          />
          <span className="ko-bracket-card__colon">:</span>
          <input
            className="ko-bracket-score"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            aria-label={`${row.labelAway} goals`}
            value={a}
            onChange={(e) => {
              const away = e.target.value
              setKoScore(row.id, h, away)
            }}
          />
        </div>
        <BracketSlot team={row.away} label={row.labelAway} compact={size === 'sm'} />
      </div>
      {row.isDraw ? <p className="ko-bracket-card__warn">Need a winner</p> : null}
      {row.winner && row.home && row.away ? (
        <p className="ko-bracket-card__win">
          → <strong>{row.winner}</strong>
        </p>
      ) : null}
    </div>
  )
}

function mapR32(rows: R32RowState[]) {
  const m = new Map<number, R32RowState>()
  for (const r of rows) m.set(r.match, r)
  return m
}

function mapKoByMatch(rows: KoRowState[]) {
  const m = new Map<number, KoRowState>()
  for (const r of rows) m.set(r.match, r)
  return m
}

type Props = {
  r32: R32RowState[]
  r16: KoRowState[]
  qf: KoRowState[]
  sf: KoRowState[]
  final: KoRowState
  third: KoRowState
  koScores: Record<string, MatchScore | undefined>
  koDrafts: KoInputDrafts
  setKoScore: (id: string, home: string, away: string) => void
}

export function KnockoutBracketView({
  r32,
  r16,
  qf,
  sf,
  final,
  third,
  koScores,
  koDrafts,
  setKoScore,
}: Props) {
  const r32m = useMemo(() => mapR32(r32), [r32])
  const r16m = useMemo(() => mapKoByMatch(r16), [r16])
  const qfm = useMemo(() => mapKoByMatch(qf), [qf])
  const sfm = useMemo(() => mapKoByMatch(sf), [sf])

  const sf1 = sfm.get(1)
  const sf2 = sfm.get(2)

  return (
    <div className="ko-bracket-view">
      <p className="ko-bracket-view__hint">Scroll horizontally on small screens. Scores sync with the by-round view.</p>
      <div className="ko-bracket-scroll">
        <div className="ko-bracket" aria-label="Knockout bracket">
          <div className="ko-bracket__half ko-bracket__half--left">
            <div className="ko-bracket__col">
              <span className="ko-bracket__col-label">R32</span>
              {LEFT_R32_PAIRS.map(([a, b]) => (
                <div key={`${a}-${b}`} className="ko-bracket__pair">
                  <BracketMatchCard
                    row={r32m.get(a)!}
                    koScores={koScores}
                    koDrafts={koDrafts}
                    setKoScore={setKoScore}
                    size="sm"
                  />
                  <BracketMatchCard
                    row={r32m.get(b)!}
                    koScores={koScores}
                    koDrafts={koDrafts}
                    setKoScore={setKoScore}
                    size="sm"
                  />
                </div>
              ))}
            </div>
            <div className="ko-bracket__connector ko-bracket__connector--forward" aria-hidden="true" />
            <div className="ko-bracket__col">
              <span className="ko-bracket__col-label">R16</span>
              {LEFT_R16.map((n) => (
                <div key={n} className="ko-bracket__single">
                  <BracketMatchCard
                    row={r16m.get(n)!}
                    koScores={koScores}
                    koDrafts={koDrafts}
                    setKoScore={setKoScore}
                    size="sm"
                  />
                </div>
              ))}
            </div>
            <div className="ko-bracket__connector ko-bracket__connector--forward" aria-hidden="true" />
            <div className="ko-bracket__col">
              <span className="ko-bracket__col-label">QF</span>
              {LEFT_QF.map((n) => (
                <div key={n} className="ko-bracket__single ko-bracket__single--tall">
                  <BracketMatchCard
                    row={qfm.get(n)!}
                    koScores={koScores}
                    koDrafts={koDrafts}
                    setKoScore={setKoScore}
                    size="sm"
                  />
                </div>
              ))}
            </div>
            <div className="ko-bracket__connector ko-bracket__connector--forward" aria-hidden="true" />
            <div className="ko-bracket__col">
              <span className="ko-bracket__col-label">SF</span>
              {sf1 ? (
                <div className="ko-bracket__single ko-bracket__single--xfat">
                  <BracketMatchCard
                    row={sf1}
                    koScores={koScores}
                    koDrafts={koDrafts}
                    setKoScore={setKoScore}
                    size="md"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="ko-bracket__spine">
            <div className="ko-bracket__spine-third">
              <span className="ko-bracket__col-label">3rd</span>
              <BracketMatchCard
                row={third}
                koScores={koScores}
                koDrafts={koDrafts}
                setKoScore={setKoScore}
                size="md"
              />
            </div>
            <div className="ko-bracket__spine-final">
              <span className="ko-bracket__col-label">Final</span>
              <BracketMatchCard
                row={final}
                koScores={koScores}
                koDrafts={koDrafts}
                setKoScore={setKoScore}
                size="md"
              />
            </div>
          </div>

          <div className="ko-bracket__half ko-bracket__half--right">
            <div className="ko-bracket__col">
              <span className="ko-bracket__col-label">SF</span>
              {sf2 ? (
                <div className="ko-bracket__single ko-bracket__single--xfat">
                  <BracketMatchCard
                    row={sf2}
                    koScores={koScores}
                    koDrafts={koDrafts}
                    setKoScore={setKoScore}
                    size="md"
                  />
                </div>
              ) : null}
            </div>
            <div className="ko-bracket__connector ko-bracket__connector--back" aria-hidden="true" />
            <div className="ko-bracket__col">
              <span className="ko-bracket__col-label">QF</span>
              {RIGHT_QF.map((n) => (
                <div key={n} className="ko-bracket__single ko-bracket__single--tall">
                  <BracketMatchCard
                    row={qfm.get(n)!}
                    koScores={koScores}
                    koDrafts={koDrafts}
                    setKoScore={setKoScore}
                    size="sm"
                  />
                </div>
              ))}
            </div>
            <div className="ko-bracket__connector ko-bracket__connector--back" aria-hidden="true" />
            <div className="ko-bracket__col">
              <span className="ko-bracket__col-label">R16</span>
              {RIGHT_R16.map((n) => (
                <div key={n} className="ko-bracket__single">
                  <BracketMatchCard
                    row={r16m.get(n)!}
                    koScores={koScores}
                    koDrafts={koDrafts}
                    setKoScore={setKoScore}
                    size="sm"
                  />
                </div>
              ))}
            </div>
            <div className="ko-bracket__connector ko-bracket__connector--back" aria-hidden="true" />
            <div className="ko-bracket__col">
              <span className="ko-bracket__col-label">R32</span>
              {RIGHT_R32_PAIRS.map(([a, b]) => (
                <div key={`${a}-${b}`} className="ko-bracket__pair">
                  <BracketMatchCard
                    row={r32m.get(a)!}
                    koScores={koScores}
                    koDrafts={koDrafts}
                    setKoScore={setKoScore}
                    size="sm"
                  />
                  <BracketMatchCard
                    row={r32m.get(b)!}
                    koScores={koScores}
                    koDrafts={koDrafts}
                    setKoScore={setKoScore}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
