import { useState } from 'react'
import { submitRegistration } from '../api/submitRegistration.js'

const initialValues = { name: '', ign: '', department: '', website: '' }

export default function RegistrationForm({ onSuccess }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Full name is required.'
    if (!values.ign.trim()) nextErrors.ign = 'IGN is required.'
    if (!values.department.trim()) nextErrors.department = 'Department is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (status === 'loading') return
    if (!validate()) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const name = values.name.trim()
      const ign = values.ign.trim()
      const department = values.department.trim()
      const result = await submitRegistration({ name, ign, department })

      if (result?.result === 'error') {
        setErrorMessage(result.message || 'Something went wrong — try again.')
        setStatus('error')
        return
      }

      setStatus('idle')
      onSuccess({ name, ign, department })
    } catch {
      setErrorMessage('Something went wrong — try again.')
      setStatus('error')
    }
  }

  const isLoading = status === 'loading'

  return (
    <div>
      <div className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block font-oswald text-xs font-medium uppercase tracking-wider text-[var(--text-mut)]"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={handleChange('name')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="min-h-[44px] w-full rounded-lg border border-white/10 bg-[var(--bg-deep)] px-3.5 py-2.5 font-inter text-[var(--text)] placeholder:text-[var(--text-mut)]/60 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:shadow-[0_0_12px_rgba(244,196,48,0.35)]"
            placeholder="e.g. Jordan Rivera"
          />
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-sm text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="ign"
            className="mb-1.5 block font-oswald text-xs font-medium uppercase tracking-wider text-[var(--text-mut)]"
          >
            IGN / In-Game Name
          </label>
          <input
            id="ign"
            type="text"
            autoComplete="off"
            value={values.ign}
            onChange={handleChange('ign')}
            aria-invalid={Boolean(errors.ign)}
            aria-describedby={errors.ign ? 'ign-error' : undefined}
            className="min-h-[44px] w-full rounded-lg border border-white/10 bg-[var(--bg-deep)] px-3.5 py-2.5 font-inter text-[var(--text)] placeholder:text-[var(--text-mut)]/60 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:shadow-[0_0_12px_rgba(244,196,48,0.35)]"
            placeholder="e.g. ShadowRiven"
          />
          {errors.ign && (
            <p id="ign-error" className="mt-1.5 text-sm text-red-400">
              {errors.ign}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="department"
            className="mb-1.5 block font-oswald text-xs font-medium uppercase tracking-wider text-[var(--text-mut)]"
          >
            Department
          </label>
          <input
            id="department"
            type="text"
            autoComplete="off"
            value={values.department}
            onChange={handleChange('department')}
            aria-invalid={Boolean(errors.department)}
            aria-describedby={errors.department ? 'department-error' : undefined}
            className="min-h-[44px] w-full rounded-lg border border-white/10 bg-[var(--bg-deep)] px-3.5 py-2.5 font-inter text-[var(--text)] placeholder:text-[var(--text-mut)]/60 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:shadow-[0_0_12px_rgba(244,196,48,0.35)]"
            placeholder="e.g. Engineering"
          />
          {errors.department && (
            <p id="department-error" className="mt-1.5 text-sm text-red-400">
              {errors.department}
            </p>
          )}
        </div>

        {/* Honeypot: hidden from real users, left empty to catch bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={handleChange('website')}
          />
        </div>

        {status === 'error' && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              aria-label="Dismiss error"
              className="shrink-0 text-red-300/80 hover:text-red-200"
            >
              &times;
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[var(--gold)] to-[var(--gold-deep)] px-6 font-oswald text-sm font-bold uppercase tracking-wider text-[var(--bg-deep)] shadow-[0_4px_14px_rgba(244,196,48,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(244,196,48,0.4)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(244,196,48,0.3)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Registering…
            </>
          ) : (
            'Register'
          )}
        </button>
      </div>
    </div>
  )
}
