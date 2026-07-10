import { InfoPage, Section, List } from '../components/InfoPage.jsx'

export default function MechanicsPage() {
  return (
    <InfoPage kicker="Esports League" title="Match Mechanics">
      <p className="text-center font-inter text-sm leading-relaxed text-[var(--text-mut)] sm:text-base">
        To keep the games competitive, chaotic, and fun, we are using the following custom
        settings for every 3v3 match.
      </p>

      <Section title="⚙️ 3v3 Match Mechanics & Settings">
        <List
          items={[
            <>
              <strong className="text-[var(--gold-soft)]">The Arena:</strong> The official
              tournament map is exclusively <strong>de_dust</strong>.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Full Map Open:</strong> Both bomb
              sites (A and B) are fully open for planting! Terrorists can plant anywhere, so
              Counter-Terrorists will need to communicate and rotate fast.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">
                Win Condition (Best of 30):
              </strong>{' '}
              The first team to win 16 rounds wins the match. There is a maximum of 15 rounds
              per half. Matches should take about 40-50 minutes.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Switching Sides:</strong> Teams will
              swap sides (Terrorist / Counter-Terrorist) after the 15th round.
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Overtime:</strong> If the game ties
              at 15-15, there will be a sudden-death Best-of-5 overtime (first to win 3
              rounds).
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Friendly Fire:</strong> OFF. (To
              save our beginners from accidentally wiping out their own team).
            </>,
            <>
              <strong className="text-[var(--gold-soft)]">Starting Money:</strong> $800
              standard start.
            </>,
          ]}
        />
      </Section>
    </InfoPage>
  )
}
