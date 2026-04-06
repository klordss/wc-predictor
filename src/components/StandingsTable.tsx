import { qualifierKey } from '../lib/thirdPlace'
import type { StandingRow } from '../types'
import {
  BadgeQualified,
  BadgeThirdAdvances,
  BadgeThirdOut,
  BadgeThirdPlace,
} from './StandingsBadges'
import { TeamWithFlag } from './TeamWithFlag'

type Props = {
  rows: StandingRow[]
  groupLetter: string
  thirdBestKeys: Set<string>
  allGroupsComplete: boolean
  /** Finished groups (for provisional third-place “outside current cut”). */
  completeGroupsCount: number
}

export function StandingsTable({
  rows,
  groupLetter,
  thirdBestKeys,
  allGroupsComplete,
  completeGroupsCount,
}: Props) {
  return (
    <div className="standings-wrap">
      <div className="standings-table-scroll">
        <table className="data-table standings-table">
          <caption className="sr-only">Group standings</caption>
          <thead>
            <tr>
              <th scope="col">Pos</th>
              <th scope="col">Team</th>
              <th scope="col">Pld</th>
              <th scope="col">W</th>
              <th scope="col">D</th>
              <th scope="col">L</th>
              <th scope="col">GF</th>
              <th scope="col">GA</th>
              <th scope="col">Pts</th>
              <th scope="col">GD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const autoQ = r.position <= 2
              const third = r.position === 3
              const key = qualifierKey(groupLetter, r.team)
              const thirdAdvances = third && thirdBestKeys.has(key)
              const thirdOut = third && allGroupsComplete && !thirdBestKeys.has(key)
              const thirdProvisionalOut =
                third &&
                !allGroupsComplete &&
                completeGroupsCount >= 8 &&
                !thirdBestKeys.has(key)

              let rowClass = 'standings-row'
              if (autoQ) rowClass += ' standings-row--q'
              else if (thirdAdvances) rowClass += ' standings-row--third-adv'
              else if (thirdProvisionalOut) rowClass += ' standings-row--third-prov-out'
              else if (third) rowClass += ' standings-row--third'

              return (
                <tr key={r.team} className={rowClass}>
                  <td className="standings-pos">
                    <div className="standings-pos__inner">
                      <span className="standings-pos__num">{r.position}</span>
                      {autoQ ? (
                        <BadgeQualified title="Top two in the group — advance automatically to the Round of 32" />
                      ) : null}
                      {third ? (
                        <BadgeThirdPlace title="Third place in this group" />
                      ) : null}
                      {thirdAdvances ? (
                        <BadgeThirdAdvances
                          title={
                            allGroupsComplete
                              ? 'Among the eight best third-place teams — advances (Pts → GD → GF)'
                              : 'In the current third-place qualifying pool from finished groups (Pts → GD → GF) — can still change'
                          }
                        />
                      ) : null}
                      {thirdOut ? (
                        <BadgeThirdOut title="Third in group but not among the eight best third-place teams on Pts → GD → GF" />
                      ) : null}
                      {thirdProvisionalOut ? (
                        <BadgeThirdOut title="Outside the current top eight thirds among finished groups — may still qualify when more groups are added" />
                      ) : null}
                    </div>
                  </td>
                  <td className="team-cell">
                    <div className="team-cell__inner">
                      <TeamWithFlag name={r.team} />
                      {thirdAdvances ? (
                        <span
                          className="team-qual-star"
                          title={
                            allGroupsComplete
                              ? 'Qualified as one of the eight best third-place teams'
                              : 'Currently in the third-place qualifying pool (live ranking)'
                          }
                          aria-label={
                            allGroupsComplete
                              ? 'Qualified as one of the eight best third-place teams'
                              : 'Currently in the third-place qualifying pool'
                          }
                        >
                          *
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="num-cell">{r.played}</td>
                  <td className="num-cell">{r.won}</td>
                  <td className="num-cell">{r.drawn}</td>
                  <td className="num-cell">{r.lost}</td>
                  <td className="num-cell">{r.gf}</td>
                  <td className="num-cell">{r.ga}</td>
                  <td className="num-cell num-cell--pts">{r.pts}</td>
                  <td className="num-cell">{r.gd > 0 ? `+${r.gd}` : String(r.gd)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
