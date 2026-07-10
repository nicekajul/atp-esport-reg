export default function SuccessPanel({ name, ign, department, onReset }) {
  return (
    <div role="status" aria-live="polite" className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gold-border)] bg-[var(--bg-deep)] shadow-[0_0_24px_rgba(244,196,48,0.35)]">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 4h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4V4Z" />
          <path d="M8 4H4v1a4 4 0 0 0 4 4" />
          <path d="M16 4h4v1a4 4 0 0 1-4 4" />
          <path d="M12 11v4" />
          <path d="M9 19h6" />
          <path d="M10 15h4l1 4H9l1-4Z" />
        </svg>
      </div>

      <h2 className="font-oswald text-2xl font-bold uppercase tracking-wide text-white">
        You're locked in!
      </h2>
      <p className="mt-1 font-oswald text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
        Registration confirmed
      </p>

      <dl className="mt-6 space-y-3 rounded-xl border border-[var(--gold-border)] bg-[var(--bg-deep)] p-4 text-left">
        <div>
          <dt className="font-oswald text-xs uppercase tracking-wider text-[var(--text-mut)]">
            Full Name
          </dt>
          <dd className="mt-0.5 font-inter text-base text-[var(--text)]">{name}</dd>
        </div>
        <div>
          <dt className="font-oswald text-xs uppercase tracking-wider text-[var(--text-mut)]">
            IGN
          </dt>
          <dd className="mt-0.5 font-inter text-base text-[var(--text)]">{ign}</dd>
        </div>
        <div>
          <dt className="font-oswald text-xs uppercase tracking-wider text-[var(--text-mut)]">
            Department
          </dt>
          <dd className="mt-0.5 font-inter text-base text-[var(--text)]">{department}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--gold)] bg-transparent px-6 font-oswald text-sm font-semibold uppercase tracking-wider text-[var(--gold)] transition hover:bg-[var(--gold)]/10 active:bg-[var(--gold)]/20"
      >
        Register another player
      </button>
    </div>
  )
}
