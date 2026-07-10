export function InfoPage({ title, kicker, children }) {
  return (
    <div className="w-full max-w-[720px] rounded-2xl border border-[var(--gold-border)] bg-[var(--panel)] p-6 shadow-[0_0_50px_rgba(244,196,48,0.12),0_0_1px_rgba(244,196,48,0.4)] sm:p-8">
      <header className="mb-6 text-center">
        {kicker && (
          <p className="font-oswald text-xs font-medium uppercase tracking-[0.3em] text-[var(--gold-soft)]/80">
            {kicker}
          </p>
        )}
        <h1 className="mt-1 font-cinzel text-2xl font-semibold tracking-wide text-[var(--gold)] sm:text-3xl">
          {title}
        </h1>
      </header>
      <div className="space-y-8">{children}</div>
    </div>
  )
}

export function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-3 font-oswald text-base font-bold uppercase tracking-wide text-white sm:text-lg">
        {title}
      </h2>
      <div className="space-y-3 font-inter text-sm leading-relaxed text-[var(--text)] sm:text-base">
        {children}
      </div>
    </section>
  )
}

export function List({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function SubHeading({ children }) {
  return (
    <h3 className="font-oswald text-sm font-semibold uppercase tracking-wide text-[var(--gold-soft)]">
      {children}
    </h3>
  )
}
