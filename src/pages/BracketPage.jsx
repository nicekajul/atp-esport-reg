import { useEffect, useState } from 'react'
import { SingleEliminationBracket, SVGViewer } from '@g-loot/react-tournament-brackets'
import { InfoPage, Section, List } from '../components/InfoPage.jsx'

// Deterministic pseudo-random ordering so the Group A/B split stays stable across
// reloads for the same set of teams, instead of reshuffling every page visit.
function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return hash
}

function normalizeTeams(teams) {
  return teams.map((team, index) => ({
    id: team.id ?? `team-${index + 1}`,
    name: team.name || `Team ${index + 1}`,
    players: Array.isArray(team.players) ? team.players : [],
  }))
}

// Splits teams into two even groups (Group A / Group B) using a stable shuffle.
function splitIntoGroups(teams) {
  const normalized = normalizeTeams(teams)
  const shuffled = [...normalized].sort((a, b) => hashString(a.id) - hashString(b.id))

  const half = Math.ceil(shuffled.length / 2)
  return {
    groupA: shuffled.slice(0, half),
    groupB: shuffled.slice(half),
  }
}

function buildRoundRobinFixtures(teams, labelPrefix) {
  const participants = [...teams]

  if (participants.length < 2) {
    return []
  }

  const roster = [...participants]
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

      matches.push({
        id: `${labelPrefix}-round-${roundIndex + 1}-match-${i + 1}`,
        home,
        away,
      })
    }

    rounds.push({
      id: `${labelPrefix}-${roundIndex + 1}`,
      title: `${labelPrefix} — Round ${roundIndex + 1}`,
      matches,
    })

    const lastTeam = rotation.pop()
    rotation.splice(1, 0, lastTeam)
  }

  return rounds
}

// Pads a group's qualifiers to exactly 4 slots with Byes so the crossover bracket
// always has a fixed shape, even before real group-stage standings exist.
function topFourWithByes(groupTeams, groupLabel) {
  const qualifiers = groupTeams.slice(0, 4).map((team) => ({ ...team, isBye: false }))

  while (qualifiers.length < 4) {
    qualifiers.push({
      id: `bye-${groupLabel}-${qualifiers.length + 1}`,
      name: 'Bye',
      players: [],
      isBye: true,
    })
  }

  return qualifiers
}

// Standard World Cup-style crossover: 1st in a group faces 4th in the other, 2nd faces 3rd.
function buildPlayoffMatches(groupA, groupB) {
  const qualifiersA = topFourWithByes(groupA, 'A')
  const qualifiersB = topFourWithByes(groupB, 'B')

  const quarterfinalPairs = [
    [qualifiersA[0], qualifiersB[3]],
    [qualifiersA[1], qualifiersB[2]],
    [qualifiersB[0], qualifiersA[3]],
    [qualifiersB[1], qualifiersA[2]],
  ]

  const totalRounds = 3
  const roundLabels = ['Quarterfinals', 'Semifinals', 'Final']
  const matches = []

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const currentRoundSize = 4 / 2 ** roundIndex
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
        const [topTeam, bottomTeam] = quarterfinalPairs[matchIndex]

        participants = [
          {
            id: topTeam.id,
            name: topTeam.name,
            status: topTeam.isBye ? 'NO_SHOW' : null,
            players: topTeam.players,
            resultText: topTeam.isBye ? 'BYE' : null,
          },
          {
            id: bottomTeam.id,
            name: bottomTeam.name,
            status: bottomTeam.isBye ? 'NO_SHOW' : null,
            players: bottomTeam.players,
            resultText: bottomTeam.isBye ? 'BYE' : null,
          },
        ]
      }

      matches.push({
        id: matchId,
        name: `${label} ${matchIndex + 1}`,
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

function CustomMatch({ topParty, bottomParty }) {
  const renderParty = (party) => {
    const playerText = party?.players?.length ? party.players.join(' • ') : ''

    return (
      <div
        title={playerText || undefined}
        className="flex min-h-[44px] flex-col justify-center rounded-md border border-white/10 bg-[rgba(255,255,255,0.04)] px-2 py-1.5 text-left"
      >
        <span className="font-inter text-[11px] font-semibold text-white">
          {party?.name || 'TBD'}
        </span>
        {playerText ? (
          <span className="mt-0.5 text-[10px] text-[var(--text-mut)]">{playerText}</span>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex min-w-[180px] flex-col gap-2 rounded-lg border border-white/10 bg-[rgba(10,14,26,0.94)] p-2 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
      {renderParty(topParty)}
      <div className="h-px w-full bg-white/10" />
      {renderParty(bottomParty)}
    </div>
  )
}

function GroupRoundRobin({ title, rounds }) {
  return (
    <div>
      <h3 className="mb-3 font-oswald text-sm font-semibold uppercase tracking-wide text-[var(--gold-soft)]">
        {title}
      </h3>
      {rounds.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center font-inter text-sm text-[var(--text-mut)]">
          Not enough teams yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => (
            <div key={round.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h4 className="mb-2 font-oswald text-xs font-semibold uppercase tracking-wide text-[var(--text-mut)]">
                {round.title}
              </h4>
              <ul className="space-y-2">
                {round.matches.map((match) => (
                  <li
                    key={match.id}
                    className="flex flex-wrap items-center gap-2 font-inter text-sm text-[var(--text)]"
                  >
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--text-mut)]">
                      Match
                    </span>
                    <span className="font-semibold text-white">{match.home.name}</span>
                    <span className="text-[var(--text-mut)]">vs</span>
                    <span className="font-semibold text-white">{match.away.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BracketPage() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadTeams() {
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
        const nextTeams = Array.isArray(payload?.teams) ? payload.teams : []
        setTeams(nextTeams)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Unable to load teams. Registration is still open.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadTeams()

    return () => controller.abort()
  }, [])

  const { groupA, groupB } = splitIntoGroups(teams)
  const groupARounds = buildRoundRobinFixtures(groupA, 'Group A')
  const groupBRounds = buildRoundRobinFixtures(groupB, 'Group B')
  const playoffMatches = teams.length >= 2 ? buildPlayoffMatches(groupA, groupB) : []

  return (
    <InfoPage kicker="Esports League" title="Tournament Bracket">
      <Section title="🧠 Tournament Flow">
        <p>
          Teams are split evenly into Group A and Group B for a round-robin stage, then the
          top 4 from each group cross over into a single-elimination playoff bracket.
        </p>
        <List
          items={[
            <>
              <strong className="text-[var(--gold-soft)]">Group Stage:</strong> Each team plays
              every other team in its own group.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Crossover Playoffs:</strong> 1st place
              in a group faces 4th place in the other group, and 2nd faces 3rd — the classic
              World Cup-style bracket.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Byes:</strong> If a group has fewer
              than 4 teams, the schedule automatically inserts Bye slots.
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
          <div className="grid gap-4 sm:grid-cols-2">
            <GroupRoundRobin title="Group A" rounds={groupARounds} />
            <GroupRoundRobin title="Group B" rounds={groupBRounds} />
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
            There are not enough teams to build the playoff bracket yet.
          </div>
        ) : (
          <>
            <p className="mb-4 font-inter text-xs text-[var(--text-mut)]">
              Seeded by current group order — this will reflect real standings once match
              results are tracked.
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-4">
              <SingleEliminationBracket
                matches={playoffMatches}
                matchComponent={CustomMatch}
                svgWrapper={({ children, ...props }) => (
                  <SVGViewer width={980} height={620} {...props}>
                    {children}
                  </SVGViewer>
                )}
              />
            </div>
          </>
        )}
      </Section>
    </InfoPage>
  )
}
