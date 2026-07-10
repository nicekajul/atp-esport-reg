import { useState } from 'react'

export default function Emblem() {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--gold-border)] bg-[var(--bg-deep)] shadow-[0_0_24px_rgba(244,196,48,0.25)]">
      {!imgError ? (
        <img
          src="/logo.png"
          alt="Author's Tranquility crest"
          className="h-full w-full rounded-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          viewBox="0 0 64 64"
          className="h-10 w-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="featherGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--gold-soft)" />
              <stop offset="50%" stopColor="var(--gold)" />
              <stop offset="100%" stopColor="var(--gold-deep)" />
            </linearGradient>
          </defs>
          <path
            d="M32 4C22 14 16 26 16 40c0 8 4 16 4 16l6-10c6 2 12 0 16-6 5-7 6-18 4-30-6 2-11 6-14 10z"
            fill="url(#featherGold)"
          />
          <path d="M32 20 L26 46" stroke="var(--bg-deep)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}
