import { useCallback, useMemo, useState } from 'react'
import tournament from './data/worldCup2026.json'
import './App.css'
import { FixturesTable } from './components/FixturesTable'
import { GroupPicker } from './components/GroupPicker'
import { KnockoutView } from './components/KnockoutView'
import { StandingsTable } from './components/StandingsTable'
import { ThirdPlaceTable } from './components/ThirdPlaceTable'
import { useKnockoutScores } from './hooks/useKnockoutScores'
import { usePredictions } from './hooks/usePredictions'
import { generateFixtures, matchesForGroup, teamsInGroupOrder } from './lib/fixtures'
import { getPartialGroupPodiums } from './lib/groupQualifiers'
import { computeStandings } from './lib/standings'
import {
  allGroupsFullyScored,
  computeThirdBestQualifierKeys,
  getRankedBestThirdPlaces,
  getThirdPlaceTableRows,
} from './lib/thirdPlace'
import type { GroupEntry } from './types'

type AppPhase = 'groups' | 'knockout'

const groups = tournament.groups as GroupEntry[]
const groupLetters = groups.map((g) => g.group)

function groupHasIncomplete(
  fixturesList: ReturnType<typeof generateFixtures>,
  letter: string,
  scores: Record<string, unknown>,
): boolean {
  return matchesForGroup(fixturesList, letter).some((m) => scores[m.id] === undefined)
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('groups')
  const [group, setGroup] = useState(groupLetters[0] ?? 'A')
  const fixtures = useMemo(() => generateFixtures(groups), [])
  const { scores, scoresRevision, setMatchScore, clearGroupScores, resetAllScores } = usePredictions()
  const { koScores, koDrafts, koRevision, setKoScore, resetKnockout } = useKnockoutScores()

  const partialPodiums = useMemo(
    () => getPartialGroupPodiums(groups, fixtures, scores),
    [fixtures, scores],
  )

  const completeGroupsCount = useMemo(
    () => groupLetters.filter((L) => partialPodiums[L] !== null).length,
    [partialPodiums],
  )

  const clearEverything = useCallback(() => {
    resetAllScores()
    resetKnockout()
  }, [resetAllScores, resetKnockout])

  const currentGroup = groups.find((g) => g.group === group) ?? groups[0]
  const groupMatches = useMemo(() => matchesForGroup(fixtures, group), [fixtures, group])
  const groupTeams = useMemo(() => teamsInGroupOrder(currentGroup), [currentGroup])

  const standings = useMemo(
    () => computeStandings(groupTeams, groupMatches, scores),
    [groupTeams, groupMatches, scores],
  )

  const groupComplete = useMemo(
    () => groupMatches.every((m) => scores[m.id] !== undefined),
    [groupMatches, scores],
  )

  const anyGroupIncomplete = useMemo(
    () => groupLetters.some((letter) => groupHasIncomplete(fixtures, letter, scores)),
    [fixtures, scores],
  )

  const allGroupsComplete = useMemo(
    () => allGroupsFullyScored(groups, fixtures, scores),
    [groups, fixtures, scores],
  )

  const rankedThirds = useMemo(
    () => getRankedBestThirdPlaces(groups, fixtures, scores, allGroupsComplete),
    [groups, fixtures, scores, allGroupsComplete],
  )

  const thirdBestKeys = useMemo(
    () => computeThirdBestQualifierKeys(groups, fixtures, scores, allGroupsComplete),
    [groups, fixtures, scores, allGroupsComplete],
  )

  const thirdPlaceRows = useMemo(
    () => getThirdPlaceTableRows(groups, fixtures, scores, allGroupsComplete),
    [groups, fixtures, scores, allGroupsComplete],
  )

  const headerBlurb = useMemo(() => {
    if (phase === 'knockout') {
      if (completeGroupsCount === 0) {
        return 'Finish a group to see its 1st and 2nd on the bracket; third-place slots use a live ranking from completed groups.'
      }
      if (!allGroupsComplete) {
        return 'Knockout updates as you lock groups — third-place assignments re-sort until all twelve are done.'
      }
      return 'Predict each knockout tie; winners advance through the bracket to the final and third-place match.'
    }
    const played = groupMatches.filter((m) => scores[m.id] !== undefined).length
    const leader = standings[0]
    if (played === 0) {
      return `Group ${group} is wide open — enter scores to see the live standings shift.`
    }
    if (leader && leader.played > 0 && leader.pts > 0) {
      return `Group ${group} could stay tight — ${leader.team} leads on points with your current picks.`
    }
    if (!groupComplete) {
      return `Group ${group} — finish the remaining fixtures to lock this table.`
    }
    return `Group ${group} is fully predicted — tweak any score to explore other outcomes.`
  }, [phase, completeGroupsCount, allGroupsComplete, group, groupComplete, groupMatches, scores, standings])

  const predictionStatus = useMemo(() => {
    if (groupComplete) {
      return 'Prediction status: Group complete — table reflects all your scores.'
    }
    return 'Prediction status: Awaiting remaining fixture scores…'
  }, [groupComplete])

  const goToNextIncompleteGroup = useCallback(() => {
    const start = groupLetters.indexOf(group)
    const rotated = [...groupLetters.slice(start + 1), ...groupLetters.slice(0, start + 1)]
    for (const letter of rotated) {
      if (groupHasIncomplete(fixtures, letter, scores)) {
        setGroup(letter)
        return
      }
    }
  }, [fixtures, group, scores])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__titles">
          <h1 className="app-title">
            {tournament.tournament} {tournament.year}
          </h1>
          <p className="app-subtitle">
            {phase === 'knockout'
              ? 'Knockout · 32-team single elimination'
              : 'stage' in tournament && typeof tournament.stage === 'string'
                ? `${tournament.stage} · ${tournament.format}`
                : tournament.format}
          </p>
        </div>
        <div className="app-header__right">
          <p className="app-header__blurb">{headerBlurb}</p>
          <div className="app-header__actions">
            <button
              type="button"
              className="btn"
              onClick={() => clearGroupScores(group, groupMatches.map((m) => m.id))}
            >
              Reset
            </button>
            <button type="button" className="btn" onClick={clearEverything}>
              Clear all
            </button>
          </div>
        </div>
      </header>

      <nav className="phase-nav" aria-label="Tournament phase">
        <p className="phase-nav__label">View</p>
        <div className="phase-nav__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={phase === 'groups'}
            className={`phase-tab${phase === 'groups' ? ' phase-tab--active' : ''}`}
            onClick={() => setPhase('groups')}
          >
            Group stage
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={phase === 'knockout'}
            className={`phase-tab${phase === 'knockout' ? ' phase-tab--active' : ''}`}
            onClick={() => setPhase('knockout')}
          >
            Knockout
          </button>
        </div>
      </nav>

      {phase === 'groups' ? (
        <GroupPicker groups={groupLetters} selected={group} onSelect={setGroup} />
      ) : null}

      <main className={`app-main${phase === 'knockout' ? ' app-main--knockout' : ''}`}>
        {phase === 'groups' ? (
          <>
            <section className="panel" aria-labelledby="fixtures-heading">
              <h2 id="fixtures-heading" className="panel__title">
                Group {group} – Fixtures
              </h2>
              <FixturesTable
                key={`${group}-${scoresRevision}`}
                matches={groupMatches}
                scores={scores}
                onScoreChange={setMatchScore}
              />
            </section>

            <section className="panel panel--standings" aria-labelledby="standings-heading">
              <div className="panel__head panel__head--standings">
                <h2 id="standings-heading" className="panel__title">
                  Group {group} – Live standings {'&'} predictions
                </h2>
                <div className="standings-status" role="status">
                  <span
                    className={`standings-status__dot${groupComplete ? ' standings-status__dot--complete' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="standings-status__text">{predictionStatus}</span>
                </div>
              </div>
              <StandingsTable
                rows={standings}
                groupLetter={group}
                thirdBestKeys={thirdBestKeys}
                allGroupsComplete={allGroupsComplete}
                completeGroupsCount={completeGroupsCount}
              />
              <button
                type="button"
                className="btn btn--primary btn--block"
                disabled={!anyGroupIncomplete}
                onClick={goToNextIncompleteGroup}
              >
                Predict remaining groups
              </button>
              <p className="standings-note">
                <strong>Group ranking:</strong> points, goal difference, goals scored, then head-to-head among
                tied teams (same mini-table order), then alphabetical as a stand-in for fair play / drawing of
                lots.
                <br />
                <strong>Knockout (32):</strong> top two per group (24) plus the eight best third-place teams
                (ranked globally on points, GD, GF — fair play / lots not modeled). As soon as a group is finished,
                its third enters the live ranking; once nine or more groups are done, only the current top eight
                thirds count until the group stage is complete.
                <br />
                <span className="standings-note__star-legend">
                  <span className="team-qual-star team-qual-star--legend" aria-hidden="true">
                    *
                  </span>{' '}
                  Third in group and currently in the qualifying third-place pool (updates each time you finish a
                  group; confirmed when all twelve are done).
                </span>
              </p>
            </section>

            <section
              className="panel panel--third-place-global"
              aria-labelledby="third-place-global-heading"
            >
              <ThirdPlaceTable
                rows={thirdPlaceRows}
                allGroupsComplete={allGroupsComplete}
                knownCount={completeGroupsCount}
              />
            </section>
          </>
        ) : (
          <KnockoutView
            partialPodiums={partialPodiums}
            allGroupsComplete={allGroupsComplete}
            completeGroupsCount={completeGroupsCount}
            rankedThirds={rankedThirds}
            koScores={koScores}
            koDrafts={koDrafts}
            setKoScore={setKoScore}
            koRevision={koRevision}
          />
        )}
      </main>
    </div>
  )
}
