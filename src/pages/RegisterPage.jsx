import { useState } from 'react'
import BannerHeader from '../components/BannerHeader.jsx'
import RegistrationForm from '../components/RegistrationForm.jsx'
import SuccessPanel from '../components/SuccessPanel.jsx'

export default function RegisterPage() {
  const [registration, setRegistration] = useState(null)

  return (
    <div className="w-full max-w-[480px] rounded-2xl border border-[var(--gold-border)] bg-[var(--panel)] p-6 shadow-[0_0_50px_rgba(244,196,48,0.12),0_0_1px_rgba(244,196,48,0.4)] sm:p-8">
      <header className="mb-6 text-center">
        <BannerHeader />
        <h1 className="mt-4 font-oswald text-lg font-bold uppercase tracking-wide text-white">
          Player Registration
        </h1>
      </header>

      {registration ? (
        <SuccessPanel
          name={registration.name}
          ign={registration.ign}
          department={registration.department}
          onReset={() => setRegistration(null)}
        />
      ) : (
        <RegistrationForm onSuccess={setRegistration} />
      )}
    </div>
  )
}
