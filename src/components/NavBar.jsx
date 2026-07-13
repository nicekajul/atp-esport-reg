import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Register', end: true },
  { to: '/details', label: 'Tournament Details' },
  { to: '/mechanics', label: 'Match Mechanics' },
  { to: '/bracket', label: 'Bracket' },
]

export default function NavBar() {
  return (
    <nav className="mx-auto mb-6 flex w-full max-w-[720px] flex-wrap items-center justify-center gap-2 sm:gap-3">
      {links.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              'min-h-[40px] rounded-full border px-4 py-1.5 font-oswald text-xs font-semibold uppercase tracking-wider transition sm:text-sm',
              isActive
                ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)] shadow-[0_0_12px_rgba(244,196,48,0.25)]'
                : 'border-white/10 text-[var(--text-mut)] hover:border-[var(--gold-border)] hover:text-[var(--gold-soft)]',
            ].join(' ')
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
