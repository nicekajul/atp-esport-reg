import { useEffect, useRef, useState } from 'react'
import { SingleEliminationBracket, SVGViewer } from '@g-loot/react-tournament-brackets'
import { InfoPage, Section, List } from '../components/InfoPage.jsx'

const BRACKET_MIN_WIDTH = 820
const BRACKET_ASPECT_RATIO = 620 / 980

// The library boxes each match in a fixed-size foreignObject (default 300x110) —
// our two-team card needs more room than the default so full IGNs/rosters aren't
// clipped, so these are passed explicitly via options.style below.
const MATCH_BOX_WIDTH = 280
const MATCH_BOX_HEIGHT = 130

function normalizeTeams(teams) {
  return teams.map((team, index) => ({
    id: team.id ?? `team-${index + 1}`,
    // Sheet cells can hold a number (e.g. someone drag-filled 1, 2, 3... over the
    // default "TBD" names) — always coerce to a string, since downstream code
    // (localeCompare for standings sort, truncate/join for display) assumes text.
    name: team.name != null && team.name !== '' ? String(team.name) : `Team ${index + 1}`,
    group: team.group === 'A' || team.group === 'B' ? team.group : null,
    players: Array.isArray(team.players) ? team.players : [],
  }))
}

function splitIntoGroups(teams) {
  const normalized = normalizeTeams(teams)
  return {
    groupA: normalized.filter((team) => team.group === 'A'),
    groupB: normalized.filter((team) => team.group === 'B'),
  }
}

// Full round-robin fixture list (every possible pairing) for a group, grouped into
// simultaneous "rounds" via the circle method — this is the complete matchup plan,
// separate from the actual dated Match Schedule (which plays one match a week).
function buildRoundRobinFixtures(teams, labelPrefix) {
  if (teams.length < 2) return []

  const roster = [...teams]
  if (roster.length % 2 !== 0) {
    roster.push({ id: `bye-${labelPrefix}-${roster.length + 1}`, name: 'Bye', players: [] })
  }

  const rounds = []
  const rotation = [...roster]

  for (let roundIndex = 0; roundIndex < roster.length - 1; roundIndex += 1) {
    const matches = []

    for (let i = 0; i < rotation.length / 2; i += 1) {
      const home = rotation[i]
      const away = rotation[rotation.length - 1 - i]

      // Drop matches against the Bye placeholder — there's no real match to show.
      if (home.name === 'Bye' || away.name === 'Bye') continue

      matches.push({
        id: `${labelPrefix}-round-${roundIndex + 1}-match-${i + 1}`,
        home,
        away,
      })
    }

    if (matches.length > 0) {
      rounds.push({
        id: `${labelPrefix}-${roundIndex + 1}`,
        roundNumber: roundIndex + 1,
        matches,
      })
    }

    const lastTeam = rotation.pop()
    rotation.splice(1, 0, lastTeam)
  }

  return rounds
}

function emptyRecord(id, name) {
  // name can arrive as a number from raw sheet data — sort/display below assume a string.
  return { id, name: String(name ?? id), played: 0, wins: 0, losses: 0, scoreFor: 0, scoreAgainst: 0, points: 0 }
}

// Standings from the schedule's recorded scores: win = 3 pts, tie-broken by wins
// then score differential. A group's standings are "final" only once every one of
// its scheduled matches has both scores filled in.
//
// Keyed by Team ID, not name — every team starts out named the same literal "TBD"
// until an admin renames it, so keying by name would collapse multiple teams into
// a single row (a later team's Map entry silently overwrites an earlier one).
function computeStandings(groupTeams, groupMatches) {
  const stats = new Map()
  groupTeams.forEach((team) => stats.set(team.id, emptyRecord(team.id, team.name)))

  groupMatches.forEach((match) => {
    if (match.scoreA == null || match.scoreB == null) return

    const aId = match.teamAId ?? match.teamA
    const bId = match.teamBId ?? match.teamB
    const a = stats.get(aId) ?? emptyRecord(aId, match.teamA)
    const b = stats.get(bId) ?? emptyRecord(bId, match.teamB)

    a.played += 1
    b.played += 1
    a.scoreFor += match.scoreA
    a.scoreAgainst += match.scoreB
    b.scoreFor += match.scoreB
    b.scoreAgainst += match.scoreA

    if (match.scoreA > match.scoreB) {
      a.wins += 1
      a.points += 3
      b.losses += 1
    } else if (match.scoreB > match.scoreA) {
      b.wins += 1
      b.points += 3
      a.losses += 1
    }

    stats.set(aId, a)
    stats.set(bId, b)
  })

  const standings = [...stats.values()].sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points
    if (y.wins !== x.wins) return y.wins - x.wins
    const diffX = x.scoreFor - x.scoreAgainst
    const diffY = y.scoreFor - y.scoreAgainst
    if (diffY !== diffX) return diffY - diffX
    return x.name.localeCompare(y.name)
  })

  const isComplete =
    groupMatches.length > 0 && groupMatches.every((m) => m.scoreA != null && m.scoreB != null)

  return { standings, isComplete }
}

// Tallies a Best-of-N series from its recorded per-game scores. A series is only
// "decided" once one side has reached the majority of games (1 of 1 for a single
// match, 2 of 3 for a Best of 3) — a partially-played series has no winner yet.
function computeSeriesResult(games, bestOf) {
  const winsA = games.filter((g) => g.a > g.b).length
  const winsB = games.filter((g) => g.b > g.a).length
  const neededWins = Math.ceil((bestOf || 1) / 2)
  const winner = winsA >= neededWins ? 'A' : winsB >= neededWins ? 'B' : null
  return { winsA, winsB, winner, isComplete: winner !== null }
}

const PLACE_LABELS = ['1st', '2nd']

// Which teams actually reach the playoffs isn't known until the Group Stage
// finishes, so a semifinal slot shows a standing placeholder ("Group A • 1st")
// until that group's standings are complete, then reveals the real team. A slot
// is a Bye only if the group is too small to even have a team in that standing.
function seedFromStandings(groupLabel, place, groupSize, standings, isComplete) {
  const isBye = place > groupSize
  if (isBye) {
    return { id: `seed-${groupLabel}-${place}`, name: 'Bye', isBye: true }
  }

  if (isComplete && standings[place - 1]) {
    return { id: `seed-${groupLabel}-${place}-${standings[place - 1].name}`, name: standings[place - 1].name, isBye: false }
  }

  return {
    id: `seed-${groupLabel}-${place}`,
    name: `Group ${groupLabel} • ${PLACE_LABELS[place - 1]}`,
    isBye: false,
  }
}

// Builds a participant entry with score/win-loss info from a decided-or-in-progress
// series against the OTHER party in the same match (so each side shows its own game
// win count once any games have been recorded).
function seriesParticipant(seed, ownWins, otherWins, hasGames, isWinner) {
  return {
    id: seed.id,
    name: seed.name,
    status: seed.isBye ? 'NO_SHOW' : isWinner === true ? 'WON' : isWinner === false ? 'LOST' : null,
    resultText: seed.isBye ? 'BYE' : hasGames ? String(ownWins) : null,
  }
}

// Top 2 from each group cross over: 1st in a group faces 2nd in the other. Semifinal
// winners are pulled from the Playoffs sheet's recorded scores and fed forward as the
// Final's actual participants once each series is decided.
function buildPlayoffMatches(groupASize, groupBSize, standingsA, standingsB, isCompleteA, isCompleteB, playoffs) {
  const seedsA = [1, 2].map((place) => seedFromStandings('A', place, groupASize, standingsA, isCompleteA))
  const seedsB = [1, 2].map((place) => seedFromStandings('B', place, groupBSize, standingsB, isCompleteB))

  const semifinalPairs = [
    [seedsA[0], seedsB[1]],
    [seedsB[0], seedsA[1]],
  ]

  const totalRounds = 2
  const roundLabels = ['Semifinals', 'Final (Best of 3)']
  const matches = []

  // Semifinal winners, resolved below, feed into the Final's participants.
  const semifinalWinners = []

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const currentRoundSize = 2 / 2 ** roundIndex
    const label = roundLabels[roundIndex]

    for (let matchIndex = 0; matchIndex < currentRoundSize; matchIndex += 1) {
      const matchId = `playoff-${roundIndex + 1}-${matchIndex + 1}`
      const nextMatchId =
        roundIndex + 1 < totalRounds ? `playoff-${roundIndex + 2}-${Math.floor(matchIndex / 2) + 1}` : null

      let participants = [
        { id: `tbd-${matchId}-top`, name: 'TBD', status: null },
        { id: `tbd-${matchId}-bottom`, name: 'TBD', status: null },
      ]

      if (roundIndex === 0) {
        const [topSeed, bottomSeed] = semifinalPairs[matchIndex]
        const slotId = matchIndex === 0 ? 'SF1' : 'SF2'
        const slot = playoffs?.[slotId]
        const hasGames = Boolean(slot?.games?.length)
        const result = hasGames
          ? computeSeriesResult(slot.games, slot.bestOf || 1)
          : { winsA: 0, winsB: 0, winner: null, isComplete: false }

        participants = [
          seriesParticipant(
            topSeed,
            result.winsA,
            result.winsB,
            hasGames,
            result.winner ? result.winner === 'A' : undefined,
          ),
          seriesParticipant(
            bottomSeed,
            result.winsB,
            result.winsA,
            hasGames,
            result.winner ? result.winner === 'B' : undefined,
          ),
        ]

        if (result.isComplete && !topSeed.isBye && !bottomSeed.isBye) {
          semifinalWinners[matchIndex] = result.winner === 'A' ? topSeed : bottomSeed
        } else if (topSeed.isBye && !bottomSeed.isBye) {
          semifinalWinners[matchIndex] = bottomSeed
        } else if (bottomSeed.isBye && !topSeed.isBye) {
          semifinalWinners[matchIndex] = topSeed
        }
      }

      if (roundIndex === 1) {
        const topWinner = semifinalWinners[0]
        const bottomWinner = semifinalWinners[1]
        const slot = playoffs?.F
        const hasGames = Boolean(slot?.games?.length)
        const result = hasGames
          ? computeSeriesResult(slot.games, slot.bestOf || 3)
          : { winsA: 0, winsB: 0, winner: null, isComplete: false }

        participants = [
          topWinner
            ? seriesParticipant(topWinner, result.winsA, result.winsB, hasGames, result.winner ? result.winner === 'A' : undefined)
            : { id: `tbd-${matchId}-top`, name: 'TBD', status: null },
          bottomWinner
            ? seriesParticipant(bottomWinner, result.winsB, result.winsA, hasGames, result.winner ? result.winner === 'B' : undefined)
            : { id: `tbd-${matchId}-bottom`, name: 'TBD', status: null },
        ]
      }

      matches.push({
        id: matchId,
        name: currentRoundSize > 1 ? `${label} ${matchIndex + 1}` : label,
        nextMatchId,
        tournamentRoundText: `${roundIndex + 1}`,
        startTime: '',
        state: 'PLAYED',
        participants,
      })
    }
  }

  return matches
}

// The bracket library renders this inside a fixed-size foreignObject (see
// MATCH_BOX_WIDTH/MATCH_BOX_HEIGHT below, passed as options.style to
// SingleEliminationBracket) — both parties use flex-1 so they always split that
// box evenly and stay fully visible instead of being clipped by a taller card.
function CustomMatch({ topParty, bottomParty }) {
  const renderParty = (party) => {
    const playerText = party?.players?.length ? party.players.join(' • ') : ''
    const isWinner = party?.status === 'WON'
    const isLoser = party?.status === 'LOST'

    return (
      <div
        title={playerText || undefined}
        className={`flex flex-1 flex-row items-center justify-between gap-2 overflow-hidden rounded-md border px-2 py-1 text-left ${
          isWinner ? 'border-[var(--gold-soft)]/50 bg-[rgba(212,175,55,0.08)]' : 'border-white/10 bg-[rgba(255,255,255,0.04)]'
        }`}
      >
        <div className="flex min-w-0 flex-col justify-center">
          <span
            className={`truncate font-inter text-[11px] font-semibold ${isLoser ? 'text-[var(--text-mut)]' : 'text-white'}`}
          >
            {party?.name || 'TBD'}
          </span>
          {playerText ? (
            <span className="mt-0.5 truncate text-[10px] text-[var(--text-mut)]">{playerText}</span>
          ) : null}
        </div>
        {party?.resultText ? (
          <span
            className={`shrink-0 font-oswald text-[11px] font-semibold ${isWinner ? 'text-[var(--gold-soft)]' : 'text-[var(--text-mut)]'}`}
          >
            {party.resultText}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col gap-1.5 rounded-lg border border-white/10 bg-[rgba(10,14,26,0.94)] p-2 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
      {renderParty(topParty)}
      <div className="h-px w-full shrink-0 bg-white/10" />
      {renderParty(bottomParty)}
    </div>
  )
}

function formatMatchDate(dateStr) {
  if (!dateStr) return ''
  // Apps Script sends "yyyy-MM-dd HH:mm" — swap the space for "T" so Date parses
  // it as local time instead of either failing or treating it as UTC.
  const date = new Date(dateStr.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function StandingsTable({ standings }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-white/5">
            <th className="px-3 py-2 text-left font-oswald text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mut)]">
              Team
            </th>
            <th className="px-2 py-2 text-center font-oswald text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mut)]">
              P
            </th>
            <th className="px-2 py-2 text-center font-oswald text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mut)]">
              W
            </th>
            <th className="px-2 py-2 text-center font-oswald text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mut)]">
              L
            </th>
            <th className="px-3 py-2 text-center font-oswald text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mut)]">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, i) => (
            <tr key={team.id} className="border-t border-white/5 odd:bg-white/[0.03]">
              <td className="px-3 py-2 font-inter text-sm text-white">
                <span className="mr-2 font-oswald text-xs font-semibold text-[var(--gold-soft)]">
                  {i + 1}
                </span>
                {team.name}
              </td>
              <td className="px-2 py-2 text-center font-inter text-sm text-[var(--text-mut)]">{team.played}</td>
              <td className="px-2 py-2 text-center font-inter text-sm text-[var(--text-mut)]">{team.wins}</td>
              <td className="px-2 py-2 text-center font-inter text-sm text-[var(--text-mut)]">{team.losses}</td>
              <td className="px-3 py-2 text-center font-oswald text-sm font-semibold text-white">{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScheduleTable({ matches }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-white/5">
            <th className="w-32 px-3 py-2 text-left font-oswald text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mut)]">
              Date
            </th>
            <th className="px-3 py-2 text-left font-oswald text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mut)]">
              Match
            </th>
            <th className="w-16 px-3 py-2 text-center font-oswald text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mut)]">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => {
            const played = match.scoreA != null && match.scoreB != null
            return (
              <tr key={match.id} className="border-t border-white/5 odd:bg-white/[0.03]">
                <td className="px-3 py-2 font-inter text-xs text-[var(--text-mut)]">
                  {formatMatchDate(match.date)}
                </td>
                <td className="px-3 py-2 font-inter text-sm text-[var(--text)]">
                  <span className={played && match.scoreA > match.scoreB ? 'font-semibold text-white' : 'font-semibold text-[var(--text-mut)]'}>
                    {match.teamA}
                  </span>
                  <span className="mx-1.5 text-[var(--text-mut)]">vs</span>
                  <span className={played && match.scoreB > match.scoreA ? 'font-semibold text-white' : 'font-semibold text-[var(--text-mut)]'}>
                    {match.teamB}
                  </span>
                </td>
                <td className="px-3 py-2 text-center font-oswald text-sm text-[var(--gold-soft)]">
                  {played ? `${match.scoreA} – ${match.scoreB}` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function GroupRoundRobin({ title, rounds }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="mb-3 font-oswald text-sm font-semibold uppercase tracking-wide text-[var(--gold-soft)]">
        {title}
      </h3>
      {rounds.length === 0 ? (
        <p className="font-inter text-sm text-[var(--text-mut)]">Not enough teams yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="w-20 px-3 py-2 text-left font-oswald text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mut)]">
                  Round
                </th>
                <th className="px-3 py-2 text-left font-oswald text-[11px] font-semibold uppercase tracking-wider text-[var(--text-mut)]">
                  Match
                </th>
              </tr>
            </thead>
            <tbody>
              {rounds.flatMap((round) =>
                round.matches.map((match, matchIndex) => (
                  <tr key={match.id} className="border-t border-white/5 odd:bg-white/[0.03]">
                    {matchIndex === 0 && (
                      <td
                        rowSpan={round.matches.length}
                        className="border-t border-white/5 px-3 py-2 align-top font-oswald text-xs font-semibold text-[var(--gold-soft)]"
                      >
                        R{round.roundNumber}
                      </td>
                    )}
                    <td className="px-3 py-2 font-inter text-sm text-[var(--text)]">
                      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-1.5">
                        <span>
                          <span className="font-semibold text-white">{match.home.name}</span>
                          {match.home.players.length > 0 && (
                            <span className="ml-1.5 text-xs text-[var(--text-mut)]">
                              ({match.home.players.join(', ')})
                            </span>
                          )}
                        </span>
                        <span className="text-[var(--text-mut)]">vs</span>
                        <span>
                          <span className="font-semibold text-white">{match.away.name}</span>
                          {match.away.players.length > 0 && (
                            <span className="ml-1.5 text-xs text-[var(--text-mut)]">
                              ({match.away.players.join(', ')})
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function GroupCard({ title, groupTeams, groupMatches, standings }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="mb-3 font-oswald text-sm font-semibold uppercase tracking-wide text-[var(--gold-soft)]">
        {title}
      </h3>
      {groupTeams.length === 0 ? (
        <p className="font-inter text-sm text-[var(--text-mut)]">No teams assigned yet.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-oswald text-xs font-semibold uppercase tracking-wide text-[var(--text-mut)]">
              Standings
            </h4>
            <StandingsTable standings={standings} />
          </div>
          {groupMatches.length > 0 && (
            <div>
              <h4 className="mb-2 font-oswald text-xs font-semibold uppercase tracking-wide text-[var(--text-mut)]">
                Match Schedule
              </h4>
              <ScheduleTable matches={groupMatches} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Sizes the bracket SVG to the available container width instead of a fixed 980x620,
// so it fills wide screens without wasted whitespace and only scrolls when the
// minimum readable width genuinely doesn't fit (small phones).
function ResponsiveBracket({ matches, matchComponent }) {
  const containerRef = useRef(null)
  const [width, setWidth] = useState(BRACKET_MIN_WIDTH)

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width
      if (measured) setWidth(Math.max(Math.round(measured), BRACKET_MIN_WIDTH))
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const height = Math.round(width * BRACKET_ASPECT_RATIO)

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <SingleEliminationBracket
        matches={matches}
        matchComponent={matchComponent}
        options={{
          style: {
            width: MATCH_BOX_WIDTH,
            boxHeight: MATCH_BOX_HEIGHT,
            spaceBetweenColumns: 40,
            spaceBetweenRows: 28,
          },
        }}
        svgWrapper={({ children, bracketWidth, bracketHeight, ...props }) => {
          // react-svg-pan-zoom only widens its zoom-out limit *after* the first pan/zoom
          // event, so on load it's pinned at 100% and can't zoom out even when the
          // bracket is taller/wider than the viewer. Compute the "fit the whole
          // bracket" scale ourselves and use it as the floor from the start.
          //
          // Important: this must never go BELOW the exact fit scale. The library's pan
          // clamping assumes the scaled content is always at least as big as the
          // viewer; once it's zoomed out past that (content smaller than viewer), the
          // clamp math goes negative and the view snaps/jumps erratically. Capping at
          // exactly `fitScale` (never less) keeps it in the regime the library expects.
          const fitScale =
            bracketWidth && bracketHeight
              ? Math.min(width / bracketWidth, height / bracketHeight)
              : 1
          const scaleFactorMin = Math.min(1, fitScale)

          // Center the bracket in the viewer on load instead of starting pinned to the
          // top-left corner — only has room to act when the bracket is smaller than
          // the viewer, since pan is otherwise clamped back to the content edge.
          const startAt =
            bracketWidth && bracketHeight
              ? [Math.max(0, (width - bracketWidth) / 2), Math.max(0, (height - bracketHeight) / 2)]
              : [0, 0]

          return (
            <SVGViewer
              width={width}
              height={height}
              bracketWidth={bracketWidth}
              bracketHeight={bracketHeight}
              scaleFactorMin={scaleFactorMin}
              startAt={startAt}
              {...props}
            >
              {children}
            </SVGViewer>
          )
        }}
      />
    </div>
  )
}

export default function BracketPage() {
  const [teams, setTeams] = useState([])
  const [schedule, setSchedule] = useState([])
  const [playoffs, setPlayoffs] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
          method: 'GET',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setTeams(Array.isArray(payload?.teams) ? payload.teams : [])
        setSchedule(Array.isArray(payload?.schedule) ? payload.schedule : [])
        setPlayoffs(payload?.playoffs && typeof payload.playoffs === 'object' ? payload.playoffs : {})
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Unable to load teams. Registration is still open.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()

    return () => controller.abort()
  }, [])

  const { groupA, groupB } = splitIntoGroups(teams)
  const groupARounds = buildRoundRobinFixtures(groupA, 'Group A')
  const groupBRounds = buildRoundRobinFixtures(groupB, 'Group B')
  const scheduleA = schedule.filter((match) => match.group === 'A')
  const scheduleB = schedule.filter((match) => match.group === 'B')
  const { standings: standingsA, isComplete: isCompleteA } = computeStandings(groupA, scheduleA)
  const { standings: standingsB, isComplete: isCompleteB } = computeStandings(groupB, scheduleB)

  const playoffMatches =
    teams.length > 0
      ? buildPlayoffMatches(groupA.length, groupB.length, standingsA, standingsB, isCompleteA, isCompleteB, playoffs)
      : []

  return (
    <InfoPage kicker="Esports League" title="Tournament Bracket" maxWidthClass="max-w-[960px]">
      <Section title="🧠 Tournament Flow">
        <p>
          Teams are split evenly into Group A and Group B for a round-robin stage, then the
          top 2 from each group cross over into a single-elimination playoff bracket.
        </p>
        <List
          items={[
            <>
              <strong className="text-[var(--gold-soft)]">Group Stage:</strong> Each team plays
              every other team in its own group. Matches run every Saturday morning after shift
              — one Group A match and one Group B match each week.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Crossover Playoffs:</strong> 1st place
              in a group faces 2nd place in the other group — the classic World Cup-style
              crossover. Semifinals are single matches; the Final is a Best of 3.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Byes:</strong> If a group has fewer
              than 2 teams, the schedule automatically inserts a Bye slot.
            </>,
          ]}
        />
      </Section>

      <Section title="🏁 Group Stage">
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center font-inter text-sm text-[var(--text-mut)]">
            Fetching generated teams...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-center font-inter text-sm text-red-200">
            {error}
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center font-inter text-sm text-[var(--text-mut)]">
            No teams were returned by the Apps Script endpoint yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <GroupRoundRobin title="Group A" rounds={groupARounds} />
            <GroupRoundRobin title="Group B" rounds={groupBRounds} />
          </div>
        )}
      </Section>

      <Section title="📊 Team Standings & Match Schedule">
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center font-inter text-sm text-[var(--text-mut)]">
            Fetching generated teams...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-center font-inter text-sm text-red-200">
            {error}
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center font-inter text-sm text-[var(--text-mut)]">
            No teams were returned by the Apps Script endpoint yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <GroupCard title="Group A" groupTeams={groupA} groupMatches={scheduleA} standings={standingsA} />
            <GroupCard title="Group B" groupTeams={groupB} groupMatches={scheduleB} standings={standingsB} />
          </div>
        )}
      </Section>

      <Section title="🏆 Playoff Bracket">
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center font-inter text-sm text-[var(--text-mut)]">
            Fetching generated teams...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-center font-inter text-sm text-red-200">
            {error}
          </div>
        ) : playoffMatches.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center font-inter text-sm text-[var(--text-mut)]">
            Teams haven't been generated yet — check back once the Group Stage is set.
          </div>
        ) : (
          <>
            <p className="mb-4 font-inter text-xs text-[var(--text-mut)]">
              Which teams reach the playoffs is decided by Group Stage results, so a slot shows
              standing (e.g. "Group A • 1st") until that group's matches are all played, then
              reveals the actual team. Once a series has games recorded, each side shows its
              game-win count and the winner is highlighted — the Final's winner is pulled forward
              automatically once a Semifinal is decided.
            </p>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <ResponsiveBracket matches={playoffMatches} matchComponent={CustomMatch} />
            </div>
          </>
        )}
      </Section>
    </InfoPage>
  )
}
