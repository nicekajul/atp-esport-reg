import { InfoPage, Section, List, SubHeading } from '../components/InfoPage.jsx'

export default function DetailsPage() {
  return (
    <InfoPage kicker="Esports League" title="Tournament Details">
      <p className="text-center font-inter text-sm leading-relaxed text-[var(--text-mut)] sm:text-base">
        Welcome to the inaugural Office Counter-Strike 1.6 Tournament! Whether you are a
        seasoned headshot machine or someone who has never touched a keyboard and mouse for
        gaming, this tournament is all about team building, stress relief, and having a blast
        to close out the week.
      </p>

      <Section title="📅 Tournament Overview">
        <List
          items={[
            <>
              <strong className="text-[var(--gold-soft)]">Game:</strong> Counter-Strike 1.6
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Format:</strong> 3 vs 3
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Schedule:</strong> Every Friday,
              immediately after the end of shift
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Location:</strong> [Insert Office
              Area/Conference Room]
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Eligibility:</strong> All employees
              are welcome! No prior gaming experience required.
            </>,
          ]}
        />
      </Section>

      <Section title="🎲 Registration & The Random Draw">
        <p>
          To mix things up and get everyone playing with new people, teams will be formed
          completely by chance!
        </p>
        <List
          items={[
            <>
              <strong className="text-[var(--gold-soft)]">Sign-Up Phase:</strong> Add your
              name to the registration form.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">The Draw:</strong> On{' '}
              <strong>Tuesday, July 14, 2026</strong>, we will put all the registered names
              into a random wheel spinner online and draw teams of 3 players each.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Team Identity:</strong> Once your
              trio is drawn, get together to come up with a team name and elect a Team
              Captain.
            </>,
          ]}
        />
      </Section>

      <Section title="🏆 Tournament Format (Groups into Knockouts)">
        <p>
          We are using a "World Cup" style tournament so everyone gets plenty of playtime
          before eliminations begin!
        </p>

        <SubHeading>Phase 1: The Group Stage (Round Robin)</SubHeading>
        <List
          items={[
            'All drafted teams will be randomly split into two divisions: Group A and Group B.',
            'Every team will play against all other teams in their respective group.',
            'Teams earn points for wins. At the end of the Group Stage, the Top 4 teams from Group A and the Top 4 teams from Group B will advance to the playoffs.',
          ]}
        />

        <SubHeading>Phase 2: The Knockout Bracket (Single Elimination)</SubHeading>
        <List
          items={[
            <>
              <strong className="text-[var(--gold-soft)]">Quarter-Finals (8 Teams):</strong>{' '}
              The top 4 from each group cross over (e.g., the 1st place team in Group A plays
              the 4th place team in Group B). This is a sudden-death, single-elimination
              match.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Semi-Finals (4 Teams):</strong> The
              winners of the Quarters advance to the final four.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Grand Finals (2 Teams):</strong> The
              ultimate showdown for office supremacy! To make it epic, the Grand Final will be
              a Best-of-3 series.
            </>,
          ]}
        />
      </Section>

      <Section title="🤝 Office Code of Conduct">
        <List
          items={[
            <>
              <strong className="text-[var(--gold-soft)]">Zero Toxicity:</strong> Trash talk
              is fine, but keep it friendly, corporate-appropriate, and playful. No yelling,
              swearing, or actual hostility.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Hardware Respect:</strong> Please do
              not smash the office mice, keyboards, or desks if you get sniped.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Punctuality:</strong> If your team
              is scheduled to play, be at the setup within 10 minutes of the shift ending.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Coaching:</strong> Eliminated
              players or spectators are allowed to help guide beginners on their team, but
              "ghosting" (looking at the enemy team's screens) is strictly forbidden.
            </>,
          ]}
        />
      </Section>
    </InfoPage>
  )
}
