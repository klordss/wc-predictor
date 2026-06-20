import { formatKickoffTexas } from './kickoff'

type KoScheduleInput = {
  venue?: string
  date?: string
  kickoffCt?: string
}

function formatDate(ymd?: string): string {
  if (!ymd) return 'Date TBD'
  const d = new Date(`${ymd}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return 'Date TBD'
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatKoSchedule(meta: KoScheduleInput): { venue: string; date: string; time: string } {
  let time = 'Time TBD'
  if (meta.kickoffCt) {
    const d = new Date(meta.kickoffCt)
    time = Number.isNaN(d.getTime()) ? 'Time TBD' : formatKickoffTexas(meta.kickoffCt)
  }

  return {
    venue: meta.venue ?? 'Venue TBD',
    date: formatDate(meta.date),
    time,
  }
}
