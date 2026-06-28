import { useEffect, useMemo, useState } from 'react'
import type { KoInputDrafts } from '../hooks/useKnockoutScores'
import type { PartialGroupPodiums } from '../lib/groupQualifiers'
import { formatKoSchedule } from '../lib/koSchedule'
import { buildFullKnockoutState, type KoRowState, type R32RowState } from '../lib/knockoutEngine'
import { teamFlagCode } from '../lib/teamFlagCode'
import type { RankedThird } from '../lib/thirdPlace'
import type { MatchScore } from '../types'
import { KnockoutBracketView } from './KnockoutBracketView'

type Row = KoRowState | R32RowState

type Props = {
  partialPodiums: PartialGroupPodiums
  allGroupsComplete: boolean
  completeGroupsCount: number
  rankedThirds: RankedThird[]
  koScores: Record<string, MatchScore | undefined>
  koDrafts: KoInputDrafts
  setKoScore: (matchId: string, home: string, away: string, penHome?: string, penAway?: string) => void
  koRevision: number
}

function buildDrafts(
  rows: Row[],
  koScores: Record<string, MatchScore | undefined>,
  koDrafts: KoInputDrafts,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const r of rows) {
    const d = koDrafts[r.id]
    if (d) {
      out[`${r.id}-h`] = d.h
      out[`${r.id}-a`] = d.a
      out[`${r.id}-ph`] = d.ph
      out[`${r.id}-pa`] = d.pa
    } else {
      const s = koScores[r.id]
      out[`${r.id}-h`] = s !== undefined ? String(s.home) : ''
      out[`${r.id}-a`] = s !== undefined ? String(s.away) : ''
      out[`${r.id}-ph`] = s?.penHome !== undefined ? String(s.penHome) : ''
      out[`${r.id}-pa`] = s?.penAway !== undefined ? String(s.penAway) : ''
    }
  }
  return out
}

function KoSide({
  team,
  slotLabel,
  align = 'start',
}: {
  team: string | null
  slotLabel: string
  align?: 'start' | 'end'
}) {
  const hint = slotLabel.replace(/^Group ([A-L]) (1st|2nd|3rd)$/i, 'Group $1 · $2')
  const cls = `ko-side ko-side--${align}`
  if (team) {
    const flagCode = teamFlagCode(team)
    return (
      <div className={cls}>
        <span className={`fi fi-${flagCode} fis ko-side__flag`} role="img" aria-label={`${team} flag`} />
        <div className="ko-side__labels">
          <span className="ko-side__name">{team}</span>
          <span className="ko-slot-hint">{hint}</span>
        </div>
      </div>
    )
  }
  return (
    <div className={`${cls} ko-side--placeholder`}>
      <span className="ko-slot-placeholder">{hint}</span>
    </div>
  )
}

function KoRoundBlock({
  title,
  rows,
  koScores,
  koDrafts,
  setKoScore,
  hideTitle = false,
}: {
  title: string
  rows: Row[]
  koScores: Record<string, MatchScore | undefined>
  koDrafts: KoInputDrafts
  setKoScore: (id: string, h: string, a: string, ph?: string, pa?: string) => void
  /** When inside tabs, the tab label is visible; keep a screen-reader heading only. */
  hideTitle?: boolean
}) {
  const drafts = useMemo(() => buildDrafts(rows, koScores, koDrafts), [rows, koScores, koDrafts])

  const headingId = `ko-${title.replace(/\s/g, '-')}`

  return (
    <section className="ko-round" aria-labelledby={headingId}>
      {hideTitle ? (
        <h3 id={headingId} className="sr-only">
          {title}
        </h3>
      ) : (
        <h3 id={headingId} className="ko-round__title">
          {title}
        </h3>
      )}
      <div className="ko-round__list" role="list">
        {rows.map((row) => {
          const hk = `${row.id}-h`
          const ak = `${row.id}-a`
          const phk = `${row.id}-ph`
          const pak = `${row.id}-pa`
          const dh = drafts[hk] ?? ''
          const da = drafts[ak] ?? ''
          const dph = drafts[phk] ?? ''
          const dpa = drafts[pak] ?? ''
          const showPens = dh !== '' && da !== '' && dh === da
          const isRegularTimeDraw = Boolean(row.score && row.home && row.away && row.score.home === row.score.away)
          const schedule = formatKoSchedule(row)
          return (
            <div key={row.id} className="ko-match" role="listitem">
              <div className="ko-match__meta">
                {'fifaMatch' in row && row.fifaMatch != null ? `MATCH ${row.fifaMatch}` : `MATCH ${row.match}`}
              </div>
              <div className="ko-schedule ko-schedule--round">
                <span className="ko-schedule__chip ko-schedule__chip--venue">{schedule.venue}</span>
                <span className="ko-schedule__chip">{schedule.date}</span>
                <span className="ko-schedule__chip">{schedule.time}</span>
              </div>
              <div className="ko-match__row">
                <KoSide team={row.home} slotLabel={row.labelHome} align="start" />
                <div className={`ko-match__scores${isRegularTimeDraw ? ' ko-match__scores--draw' : ''}`}>
                  <input
                    className="fixture-score-input"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    placeholder="—"
                    aria-label={`${row.labelHome} goals`}
                    value={dh}
                    onChange={(e) => {
                      const home = e.target.value
                      const away = da
                      setKoScore(row.id, home, away, dph, dpa)
                    }}
                  />
                  <span className="ko-match__colon">:</span>
                  <input
                    className="fixture-score-input"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    placeholder="—"
                    aria-label={`${row.labelAway} goals`}
                    value={da}
                    onChange={(e) => {
                      const away = e.target.value
                      const home = dh
                      setKoScore(row.id, home, away, dph, dpa)
                    }}
                  />
                </div>
                <KoSide team={row.away} slotLabel={row.labelAway} align="end" />
              </div>
              {showPens ? (
                <div className="ko-penalties">
                  <div className="ko-penalties__row">
                    <input
                      className="fixture-score-input ko-penalties__input"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      placeholder="—"
                      aria-label={`${row.labelHome} penalties`}
                      value={dph}
                      onChange={(e) => setKoScore(row.id, dh, da, e.target.value, dpa)}
                    />
                    <span className="ko-match__colon">:</span>
                    <input
                      className="fixture-score-input ko-penalties__input"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      placeholder="—"
                      aria-label={`${row.labelAway} penalties`}
                      value={dpa}
                      onChange={(e) => setKoScore(row.id, dh, da, dph, e.target.value)}
                    />
                  </div>
                  <span className="ko-penalties__label">Penalties</span>
                </div>
              ) : null}
              {row.isDraw ? (
                <p className="ko-match__warn">Draw in regular time: enter penalties to decide the winner.</p>
              ) : null}
              {row.winner && row.home && row.away ? (
                <p className="ko-match__winner">
                  Through: <strong>{row.winner}</strong>
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SingleKoCard({
  row,
  koScores,
  koDrafts,
  setKoScore,
  hideTitle,
}: {
  row: KoRowState
  koScores: Record<string, MatchScore | undefined>
  koDrafts: KoInputDrafts
  setKoScore: (id: string, h: string, a: string, ph?: string, pa?: string) => void
  hideTitle?: boolean
}) {
  return (
    <KoRoundBlock
      title={row.round}
      rows={[row]}
      koScores={koScores}
      koDrafts={koDrafts}
      setKoScore={setKoScore}
      hideTitle={hideTitle}
    />
  )
}

type KoStageTab = 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final'

const KO_TABS: { id: KoStageTab; label: string }[] = [
  { id: 'r32', label: 'Round of 32' },
  { id: 'r16', label: 'Round of 16' },
  { id: 'qf', label: 'Quarter-finals' },
  { id: 'sf', label: 'Semi-finals' },
  { id: 'third', label: 'Third place' },
  { id: 'final', label: 'Final' },
]

export function KnockoutView({
  partialPodiums,
  allGroupsComplete,
  completeGroupsCount,
  rankedThirds,
  koScores,
  koDrafts,
  setKoScore,
  koRevision,
}: Props) {
  const state = useMemo(
    () => buildFullKnockoutState(partialPodiums, rankedThirds, koScores),
    [partialPodiums, rankedThirds, koScores],
  )

  const [activeTab, setActiveTab] = useState<KoStageTab>('r32')
  const [layoutMode, setLayoutMode] = useState<'rounds' | 'bracket'>('rounds')

  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setLayoutMode('rounds')
    }
  }, [])

  return (
    <div className="knockout-view" key={koRevision}>
      <div className="ko-gate ko-gate--inline" role="status">
        <p className="ko-gate__text">
          {completeGroupsCount === 0 ? (
            <>
              Bracket slots show labels until you finish a group; then <strong>1st</strong> and <strong>2nd</strong>{' '}
              appear on their ties. Third-place slots use a <strong>live ranking</strong> from finished groups
              only (top eight so far when nine or more groups are done).
            </>
          ) : !allGroupsComplete ? (
            <>
              <strong>
                {completeGroupsCount} of 12 groups
              </strong>{' '}
              locked — qualifiers from those groups are already placed where the bracket allows. Third-place
              assignments <strong>re-sort</strong> as you finish more groups.
            </>
          ) : (
            <>
              Every group is complete — third-place qualifiers and R32 matchups are fixed for your predictions.
            </>
          )}
        </p>
      </div>
      <p className="ko-bracket-note">
        Round of 32 (FIFA matches 73–88): the eight third-place qualifiers are <strong>matched</strong> to the eight
        &quot;3rd Group …&quot; slots so each team is eligible for its tie (same logic as the tournament matrix, without
        fair-play / lots). Later rounds follow your knockout scores.
      </p>

      <div className="ko-layout-toggle" role="group" aria-label="Knockout layout">
        <span className="ko-layout-toggle__label">Layout</span>
        <div className="ko-layout-toggle__btns">
          <button
            type="button"
            className={`ko-layout-btn${layoutMode === 'rounds' ? ' ko-layout-btn--active' : ''}`}
            onClick={() => setLayoutMode('rounds')}
            aria-pressed={layoutMode === 'rounds'}
          >
            By round
          </button>
          <button
            type="button"
            className={`ko-layout-btn${layoutMode === 'bracket' ? ' ko-layout-btn--active' : ''}`}
            onClick={() => setLayoutMode('bracket')}
            aria-pressed={layoutMode === 'bracket'}
          >
            Bracket view
          </button>
        </div>
      </div>

      {layoutMode === 'bracket' ? (
        <KnockoutBracketView
          r32={state.r32}
          r16={state.r16}
          qf={state.qf}
          sf={state.sf}
          final={state.final}
          third={state.third}
          koScores={koScores}
          koDrafts={koDrafts}
          setKoScore={setKoScore}
        />
      ) : (
        <>
          <nav className="ko-tabs" aria-label="Knockout stage">
            <div className="ko-tabs__list" role="tablist">
              {KO_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`ko-tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`ko-panel-${tab.id}`}
                  className={`ko-tab${activeTab === tab.id ? ' ko-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="ko-tab-panels">
        {activeTab === 'r32' ? (
          <div
            id="ko-panel-r32"
            role="tabpanel"
            aria-labelledby="ko-tab-r32"
            className="ko-tab-panel"
          >
            <KoRoundBlock
              title="Round of 32"
              rows={state.r32}
              koScores={koScores}
              koDrafts={koDrafts}
              setKoScore={setKoScore}
              hideTitle
            />
          </div>
        ) : null}

        {activeTab === 'r16' ? (
          <div
            id="ko-panel-r16"
            role="tabpanel"
            aria-labelledby="ko-tab-r16"
            className="ko-tab-panel"
          >
            <KoRoundBlock
              title="Round of 16"
              rows={state.r16}
              koScores={koScores}
              koDrafts={koDrafts}
              setKoScore={setKoScore}
              hideTitle
            />
          </div>
        ) : null}

        {activeTab === 'qf' ? (
          <div
            id="ko-panel-qf"
            role="tabpanel"
            aria-labelledby="ko-tab-qf"
            className="ko-tab-panel"
          >
            <KoRoundBlock
              title="Quarter-finals"
              rows={state.qf}
              koScores={koScores}
              koDrafts={koDrafts}
              setKoScore={setKoScore}
              hideTitle
            />
          </div>
        ) : null}

        {activeTab === 'sf' ? (
          <div
            id="ko-panel-sf"
            role="tabpanel"
            aria-labelledby="ko-tab-sf"
            className="ko-tab-panel"
          >
            <KoRoundBlock
              title="Semi-finals"
              rows={state.sf}
              koScores={koScores}
              koDrafts={koDrafts}
              setKoScore={setKoScore}
              hideTitle
            />
          </div>
        ) : null}

        {activeTab === 'third' ? (
          <div
            id="ko-panel-third"
            role="tabpanel"
            aria-labelledby="ko-tab-third"
            className="ko-tab-panel"
          >
            <SingleKoCard
              row={state.third}
              koScores={koScores}
              koDrafts={koDrafts}
              setKoScore={setKoScore}
              hideTitle
            />
          </div>
        ) : null}

        {activeTab === 'final' ? (
          <div
            id="ko-panel-final"
            role="tabpanel"
            aria-labelledby="ko-tab-final"
            className="ko-tab-panel"
          >
            <SingleKoCard
              row={state.final}
              koScores={koScores}
              koDrafts={koDrafts}
              setKoScore={setKoScore}
              hideTitle
            />
          </div>
        ) : null}
          </div>
        </>
      )}
    </div>
  )
}
