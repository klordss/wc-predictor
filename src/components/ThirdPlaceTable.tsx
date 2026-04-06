import type { ThirdPlaceTableRow } from '../lib/thirdPlace'
import { TeamWithFlag } from './TeamWithFlag'

type Props = {
  rows: ThirdPlaceTableRow[]
  allGroupsComplete: boolean
  knownCount: number
}

export function ThirdPlaceTable({ rows, allGroupsComplete, knownCount }: Props) {
  const qCount = rows.filter((r) => r.qualifies).length

  return (
    <div className="third-place-table-wrap">
      <div className="panel__head panel__head--standings third-place-table__head">
        <h2 id="third-place-global-heading" className="panel__title">
          Third place — all 12 groups
        </h2>
        <p className="third-place-table__sub" role="status">
          Sorted best → worst on Pts, GD, GF.{' '}
          <strong>
            {qCount} of 8
          </strong>{' '}
          slots filled
          {knownCount < 12 ? ` (${knownCount} groups locked)` : ''}
          {allGroupsComplete ? ' — final cut.' : ' — provisional until every group is done.'}
        </p>
      </div>
      <div className="standings-table-scroll">
        <table className="data-table third-place-table" aria-labelledby="third-place-global-heading">
          <caption className="sr-only">
            Third-place teams ranked across groups; top eight qualify for the Round of 32
          </caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Grp</th>
              <th scope="col">Team</th>
              <th scope="col" className="num-cell">
                Pts
              </th>
              <th scope="col" className="num-cell">
                GD
              </th>
              <th scope="col" className="num-cell">
                GF
              </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              let rowClass = 'third-place-row'
              if (r.pending) rowClass += ' third-place-row--pending'
              else if (r.qualifies) rowClass += ' third-place-row--q'
              else if (r.provisionalOut) rowClass += ' third-place-row--prov-out'
              else rowClass += ' third-place-row--out'

              let statusLabel = ''
              let statusClass = 'third-place-status'
              if (r.pending) {
                statusLabel = 'Open'
                statusClass += ' third-place-status--pending'
              } else if (r.qualifies) {
                statusLabel = 'Q'
                statusClass += ' third-place-status--q'
              } else if (r.provisionalOut) {
                statusLabel = 'Out*'
                statusClass += ' third-place-status--prov'
              } else {
                statusLabel = 'Out'
                statusClass += ' third-place-status--out'
              }

              return (
                <tr key={r.group} className={rowClass}>
                  <td className="num-cell">{r.position !== null ? r.position : '—'}</td>
                  <td className="third-place-grp">
                    <strong>{r.group}</strong>
                  </td>
                  <td className="team-cell">
                    {r.team ? (
                      <div className="team-cell__inner">
                        <TeamWithFlag name={r.team} />
                      </div>
                    ) : (
                      <span className="third-place-dash">—</span>
                    )}
                  </td>
                  <td className="num-cell">{r.pts !== null ? r.pts : '—'}</td>
                  <td className="num-cell">
                    {r.gd !== null ? (r.gd > 0 ? `+${r.gd}` : String(r.gd)) : '—'}
                  </td>
                  <td className="num-cell">{r.gf !== null ? r.gf : '—'}</td>
                  <td>
                    <span className={statusClass}>{statusLabel}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!allGroupsComplete && knownCount >= 8 ? (
        <p className="third-place-table__foot">
          * <strong>Out*</strong> — outside the current top eight among finished groups; may still qualify when more
          groups are added.
        </p>
      ) : null}
    </div>
  )
}
