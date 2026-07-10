import { useState } from 'react'
import Emblem from './Emblem.jsx'

export default function BannerHeader() {
  const [imgError, setImgError] = useState(false)

  if (!imgError) {
    return (
      <img
        src="/banner.png"
        alt="Author's Tranquility Esports League Tournament"
        className="mx-auto mb-2 w-full max-w-[360px] drop-shadow-[0_0_30px_rgba(244,196,48,0.25)]"
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <>
      <Emblem />
      <h1 className="font-cinzel text-xl font-semibold tracking-[0.12em] text-[var(--gold)] sm:text-2xl">
        AUTHOR'S TRANQUILITY
      </h1>
      <p className="mt-1 font-oswald text-xs font-medium uppercase tracking-[0.3em] text-[var(--gold-soft)]/80">
        Esports League
      </p>
    </>
  )
}
