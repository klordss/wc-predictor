/** Format an ISO kickoff in US Central Time (Texas). */
export function formatKickoffTexas(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
    timeZoneName: 'short',
  })
}

/** Calendar date in CT when it differs from the fixture `date` field (late West-coast / midnight ET slots). */
export function kickoffTexasDateLine(iso: string): string | null {
  const d = new Date(iso)
  const datePart = iso.slice(0, 10)
  const ctYmd = d.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
  if (ctYmd === datePart) return null
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Chicago',
  })
}
