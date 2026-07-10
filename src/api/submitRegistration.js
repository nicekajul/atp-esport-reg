export async function submitRegistration({ name, ign, department }) {
  const url = import.meta.env.VITE_APPS_SCRIPT_URL

  if (!url) {
    throw new Error('VITE_APPS_SCRIPT_URL is not configured')
  }

  const res = await fetch(url, {
    method: 'POST',
    // text/plain avoids a CORS preflight so Apps Script (which doesn't handle OPTIONS) works
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ name, ign, department, website: '' }),
  })

  try {
    return await res.json() // { result: 'success' } | { result: 'error', message }
  } catch {
    // Apps Script redirects can prevent reading the body even on success
    return { result: 'success' }
  }
}
