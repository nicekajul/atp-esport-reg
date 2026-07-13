import { useEffect, useState } from 'react'
import { SingleEliminationBracket, SVGViewer } from '@g-loot/react-tournament-brackets'
import { InfoPage, Section, List } from '../components/InfoPage.jsx'

function buildRoundRobinFixtures(teams) {
  const participants = teams.map((team, index) => ({
    id: team.id ?? `team-${index + 1}`,
    name: team.name || `Team ${index + 1}`,
    players: Array.isArray(team.players) ? team.players : [],
  }))

  if (participants.length < 2) {
    return []
  }

  const roster = [...participants]
  if (roster.length % 2 !== 0) {
    roster.push({ id: `bye-${roster.length + 1}`, name: 'Bye', players: [] })
  }

  const rounds = []
  const rotation = [...roster]

  for (let roundIndex = 0; roundIndex < roster.length - 1; roundIndex += 1) {
    const matches = []

    for (let i = 0; i < rotation.length / 2; i += 1) {
      const home = rotation[i]
      const away = rotation[rotation.length - 1 - i]

      matches.push({
        id: `round-${roundIndex + 1}-match-${i + 1}`,
        home,
        away,
      })
    }

    rounds.push({
      id: roundIndex + 1,
      title: `Round ${roundIndex + 1}`,
      matches,
    })

    const lastTeam = rotation.pop()
    rotation.splice(1, 0, lastTeam)
  }

  return rounds
}

function buildPlayoffMatches(teams) {
  const playoffTeams = teams.slice(0, Math.min(teams.length, 8)).map((team, index) => ({
    id: team.id ?? `team-${index + 1}`,
    name: team.name || `Team ${index + 1}`,
    players: Array.isArray(team.players) ? team.players : [],
    isBye: false,
  }))

  while (playoffTeams.length % 2 !== 0) {
    playoffTeams.push({
      id: `bye-${playoffTeams.length + 1}`,
      name: 'Bye',
      players: [],
      isBye: true,
    })
  }

  if (playoffTeams.length < 2) {
    return []
  }

  const totalRounds = Math.ceil(Math.log2(playoffTeams.length))
  const matches = []
  const roundLabels = ['Quarterfinals', 'Semifinals', 'Final']

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const currentRoundSize = playoffTeams.length / 2 ** (roundIndex + 1)
    const label = roundIndex < roundLabels.length ? roundLabels[roundIndex] : `Round ${roundIndex + 1}`

    for (let matchIndex = 0; matchIndex < currentRoundSize; matchIndex += 1) {
      const matchId = `playoff-${roundIndex + 1}-${matchIndex + 1}`
      const nextMatchId = roundIndex + 1 < totalRounds ? `playoff-${roundIndex + 2}-${Math.floor(matchIndex / 2) + 1}` : null

      let participants = [
        { id: `tbd-${matchId}-top`, name: 'TBD', status: null },
        { id: `tbd-${matchId}-bottom`, name: 'TBD', status: null },
      ]

      if (roundIndex === 0) {
        const topTeam = playoffTeams[matchIndex * 2]
        const bottomTeam = playoffTeams[matchIndex * 2 + 1]

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
          setError('Unable to load teams from the Apps Script endpoint right now.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadTeams()

    return () => controller.abort()
  }, [])

  const roundRobinFixtures = buildRoundRobinFixtures(teams)
  const playoffMatches = buildPlayoffMatches(teams)

  return (
    <InfoPage kicker="Esports League" title="Tournament Bracket">
      <Section title="🧠 Tournament Flow">
        <p>
          The opening stage is a round-robin format so every team gets more time on the floor,
          and only the later phase shifts into single-elimination playoffs.
        </p>
        <List
          items={[
            <>
              <strong className="text-[var(--gold-soft)]">Round-Robin:</strong> Teams play
              multiple matches early in the tournament to build momentum and keep the experience
              lively.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Playoffs:</strong> The strongest teams
              advance into the single-elimination bracket for the decisive rounds.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Byes:</strong> If the number of teams is
              odd, the schedule automatically inserts a Bye slot.
            </>,
          ]}
        />
      </Section>

      <Section title="🏁 Round-Robin Stage">
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center font-inter text-sm text-[var(--text-mut)]">
            Fetching generated teams...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-center font-inter text-sm text-red-200">
            {error}
          </div>
        ) : roundRobinFixtures.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center font-inter text-sm text-[var(--text-mut)]">
            No teams were returned by the Apps Script endpoint yet.
          </div>
        ) : (
          <div className="space-y-4">
            {roundRobinFixtures.map((round) => (
              <div key={round.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-3 font-oswald text-sm font-semibold uppercase tracking-wide text-[var(--gold-soft)]">
                  {round.title}
                </h3>
                <ul className="space-y-2">
                  {round.matches.map((match) => (
                    <li key={match.id} className="flex flex-wrap items-center gap-2 font-inter text-sm text-[var(--text)]">
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
        )}
      </Section>
    </InfoPage>
  )
}
