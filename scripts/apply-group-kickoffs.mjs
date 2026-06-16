/**
 * Applies Central Time (Texas) kickoffs to worldCup2026.json from FIFA schedule (ET).
 * ET − 1h → CDT in June; midnight ET rolls to 11:00 PM CT the previous calendar day.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const jsonPath = join(root, 'src/data/worldCup2026.json')

/** @type {Record<string, string>} */
const ALIAS = {
  'South Korea': 'Korea Republic',
  'Ivory Coast': "Côte d'Ivoire",
  'Cape Verde': 'Cabo Verde',
  Iran: 'IR Iran',
}

function normTeam(t) {
  return ALIAS[t] ?? t
}

/** @param {string} ymd @param {string} etHHMM */
function etToCtIso(ymd, etHHMM) {
  let [y, m, d] = ymd.split('-').map(Number)
  let [hh, mm] = etHHMM.split(':').map(Number)
  // Schedule rows list 00:00 ET on the prior host-local calendar day (e.g. Vancouver 9pm → midnight ET next day).
  if (hh === 0 && mm === 0) {
    const next = new Date(y, m - 1, d + 1)
    y = next.getFullYear()
    m = next.getMonth() + 1
    d = next.getDate()
  }
  let ctH = hh - 1
  if (ctH < 0) {
    ctH = 23
    const prev = new Date(y, m - 1, d - 1)
    y = prev.getFullYear()
    m = prev.getMonth() + 1
    d = prev.getDate()
  }
  const cy = y
  const cm = String(m).padStart(2, '0')
  const cd = String(d).padStart(2, '0')
  const cts = String(ctH).padStart(2, '0')
  const cms = String(mm).padStart(2, '0')
  return `${cy}-${cm}-${cd}T${cts}:${cms}:00-05:00`
}

/** FIFA group-stage matches 1–72: [group, home, away, date YYYY-MM-DD, ET time] */
const SCHEDULE = [
  ['A', 'Mexico', 'South Africa', '2026-06-11', '15:00'],
  ['A', 'Korea Republic', 'Czechia', '2026-06-11', '22:00'],
  ['B', 'Canada', 'Bosnia and Herzegovina', '2026-06-12', '15:00'],
  ['D', 'USA', 'Paraguay', '2026-06-12', '21:00'],
  ['C', 'Haiti', 'Scotland', '2026-06-13', '21:00'],
  ['D', 'Australia', 'Türkiye', '2026-06-13', '00:00'],
  ['C', 'Brazil', 'Morocco', '2026-06-13', '18:00'],
  ['B', 'Qatar', 'Switzerland', '2026-06-13', '15:00'],
  ['E', "Côte d'Ivoire", 'Ecuador', '2026-06-14', '19:00'],
  ['E', 'Germany', 'Curaçao', '2026-06-14', '13:00'],
  ['F', 'Netherlands', 'Japan', '2026-06-14', '16:00'],
  ['F', 'Sweden', 'Tunisia', '2026-06-14', '22:00'],
  ['H', 'Saudi Arabia', 'Uruguay', '2026-06-15', '18:00'],
  ['H', 'Spain', 'Cabo Verde', '2026-06-15', '12:00'],
  ['G', 'IR Iran', 'New Zealand', '2026-06-15', '21:00'],
  ['G', 'Belgium', 'Egypt', '2026-06-15', '15:00'],
  ['I', 'France', 'Senegal', '2026-06-16', '15:00'],
  ['I', 'Iraq', 'Norway', '2026-06-16', '18:00'],
  ['J', 'Argentina', 'Algeria', '2026-06-16', '21:00'],
  ['J', 'Austria', 'Jordan', '2026-06-16', '00:00'],
  ['L', 'Ghana', 'Panama', '2026-06-17', '19:00'],
  ['L', 'England', 'Croatia', '2026-06-17', '16:00'],
  ['K', 'Portugal', 'Congo DR', '2026-06-17', '13:00'],
  ['K', 'Uzbekistan', 'Colombia', '2026-06-17', '22:00'],
  ['A', 'Czechia', 'South Africa', '2026-06-18', '12:00'],
  ['B', 'Switzerland', 'Bosnia and Herzegovina', '2026-06-18', '15:00'],
  ['B', 'Canada', 'Qatar', '2026-06-18', '18:00'],
  ['A', 'Mexico', 'Korea Republic', '2026-06-18', '21:00'],
  ['C', 'Brazil', 'Haiti', '2026-06-19', '21:00'],
  ['C', 'Scotland', 'Morocco', '2026-06-19', '18:00'],
  ['D', 'Türkiye', 'Paraguay', '2026-06-19', '23:00'],
  ['D', 'USA', 'Australia', '2026-06-19', '15:00'],
  ['E', 'Germany', "Côte d'Ivoire", '2026-06-20', '16:00'],
  ['E', 'Ecuador', 'Curaçao', '2026-06-20', '20:00'],
  ['F', 'Netherlands', 'Sweden', '2026-06-20', '13:00'],
  ['F', 'Tunisia', 'Japan', '2026-06-20', '00:00'],
  ['H', 'Uruguay', 'Cabo Verde', '2026-06-21', '18:00'],
  ['H', 'Spain', 'Saudi Arabia', '2026-06-21', '12:00'],
  ['G', 'Belgium', 'IR Iran', '2026-06-21', '15:00'],
  ['G', 'New Zealand', 'Egypt', '2026-06-21', '21:00'],
  ['I', 'Norway', 'Senegal', '2026-06-22', '20:00'],
  ['I', 'France', 'Iraq', '2026-06-22', '17:00'],
  ['J', 'Argentina', 'Austria', '2026-06-22', '13:00'],
  ['J', 'Jordan', 'Algeria', '2026-06-22', '23:00'],
  ['L', 'England', 'Ghana', '2026-06-23', '16:00'],
  ['L', 'Panama', 'Croatia', '2026-06-23', '19:00'],
  ['K', 'Portugal', 'Uzbekistan', '2026-06-23', '13:00'],
  ['K', 'Colombia', 'Congo DR', '2026-06-23', '22:00'],
  ['C', 'Scotland', 'Brazil', '2026-06-24', '18:00'],
  ['C', 'Morocco', 'Haiti', '2026-06-24', '18:00'],
  ['B', 'Switzerland', 'Canada', '2026-06-24', '15:00'],
  ['B', 'Bosnia and Herzegovina', 'Qatar', '2026-06-24', '15:00'],
  ['A', 'Czechia', 'Mexico', '2026-06-24', '21:00'],
  ['A', 'South Africa', 'Korea Republic', '2026-06-24', '21:00'],
  ['E', 'Curaçao', "Côte d'Ivoire", '2026-06-25', '16:00'],
  ['E', 'Ecuador', 'Germany', '2026-06-25', '16:00'],
  ['F', 'Japan', 'Sweden', '2026-06-25', '19:00'],
  ['F', 'Tunisia', 'Netherlands', '2026-06-25', '19:00'],
  ['D', 'Türkiye', 'USA', '2026-06-25', '22:00'],
  ['D', 'Paraguay', 'Australia', '2026-06-25', '22:00'],
  ['I', 'Norway', 'France', '2026-06-26', '15:00'],
  ['I', 'Senegal', 'Iraq', '2026-06-26', '15:00'],
  ['G', 'Egypt', 'IR Iran', '2026-06-26', '23:00'],
  ['G', 'New Zealand', 'Belgium', '2026-06-26', '23:00'],
  ['H', 'Cabo Verde', 'Saudi Arabia', '2026-06-26', '20:00'],
  ['H', 'Uruguay', 'Spain', '2026-06-26', '20:00'],
  ['L', 'Panama', 'England', '2026-06-27', '17:00'],
  ['L', 'Croatia', 'Ghana', '2026-06-27', '17:00'],
  ['J', 'Algeria', 'Austria', '2026-06-27', '22:00'],
  ['J', 'Jordan', 'Argentina', '2026-06-27', '22:00'],
  ['K', 'Colombia', 'Portugal', '2026-06-27', '19:30'],
  ['K', 'Congo DR', 'Uzbekistan', '2026-06-27', '19:30'],
]

/** @param {string} g @param {string} h @param {string} a */
function matchId(g, h, a) {
  return `${g}:${normTeam(h)}:${normTeam(a)}`
}

/** @param {string} g @param {string} t1 @param {string} t2 */
function pairKey(g, t1, t2) {
  const a = normTeam(t1)
  const b = normTeam(t2)
  return a < b ? `${g}:${a}:${b}` : `${g}:${b}:${a}`
}

/** @type {Map<string, string>} */
const byPair = new Map()
/** @type {Map<string, string>} */
const byId = new Map()

for (const [group, home, away, date, et] of SCHEDULE) {
  const kickoffCt = etToCtIso(date, et)
  byId.set(matchId(group, home, away), kickoffCt)
  byPair.set(pairKey(group, home, away), kickoffCt)
}

const data = JSON.parse(readFileSync(jsonPath, 'utf8'))
let applied = 0
let missing = []

for (const g of data.groups) {
  for (const md of g.matchdays) {
    for (const pair of md.matches) {
      const id = `${g.group}:${pair.home}:${pair.away}`
      let kickoffCt = byId.get(id)
      if (!kickoffCt) {
        kickoffCt = byPair.get(pairKey(g.group, pair.home, pair.away))
      }
      if (kickoffCt) {
        pair.kickoffCt = kickoffCt
        applied++
      } else {
        missing.push(id)
      }
    }
  }
}

if (missing.length) {
  console.error('Missing kickoffs for:', missing)
  process.exit(1)
}

writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
console.log(`Applied kickoffCt to ${applied} matches.`)
