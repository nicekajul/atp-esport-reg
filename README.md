# Author's Tranquility — Player Registration

Esports tournament registration site. React + Vite + Tailwind CSS, submitting directly
to a Google Apps Script Web App (no backend of our own). Three routes: the registration
form, tournament details, and match mechanics.

## Stack

- React 18 + Vite
- React Router (client-side routes: `/`, `/details`, `/mechanics`)
- Tailwind CSS
- Submissions POST as JSON to a Google Apps Script Web App URL

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env file and set your Apps Script Web App URL:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXXXX/exec
   ```

   This must be the `/exec` URL from **Deploy → New deployment → Web app** in your
   Apps Script project, with access set to "Anyone". The Apps Script side should read
   `e.postData.contents` (JSON), parse `{ name, ign, department, website }`, treat a
   non-empty `website` field as a bot and ignore it, append `name`/`ign`/`department`
   to a sheet, and return JSON: `{ "result": "success" }` or
   `{ "result": "error", "message": "..." }`.

   Note: `VITE_`-prefixed env vars are bundled into the client-side JS build, so this
   URL will be visible to anyone who views your site's source. That's fine here since
   it's a public form-submission endpoint by design — never put real secrets or API
   keys in `VITE_` vars.

3. The tournament crest banner lives at `public/banner.png` and is rendered at the top
   of the card. If it's missing, the header falls back to a small circular emblem
   (`public/logo.png`, or a gold feather SVG if that's absent too) plus text.

## Run locally

```bash
npm run dev
```

Opens at `http://localhost:5173`.

## Build & deploy

```bash
npm run build
```

Outputs a static site to `dist/`. Deploy `dist/` to Netlify, Vercel, GitHub Pages, or
any static host.

Because this is a client-side-routed SPA (`/details`, `/mechanics`), the host needs to
serve `index.html` for unknown paths so deep links and refreshes don't 404:

- **Netlify**: `public/_redirects` (already included) handles this automatically.
- **Vercel**: `vercel.json` (already included) handles this automatically.
- **GitHub Pages**: doesn't support SPA rewrites natively — either use hash routing,
  or copy `dist/index.html` to `dist/404.html` after building so GitHub Pages serves
  the app shell on any unknown path.

For all hosts: connect the repo (or upload `dist/`), set build command `npm run build`,
publish directory `dist`, and add `VITE_APPS_SCRIPT_URL` as an environment variable in
the site's dashboard.

## Project structure

```
src/
  api/
    submitRegistration.js   # fetch call to the Apps Script Web App
  components/
    BannerHeader.jsx          # tournament crest banner, falls back to Emblem + text
    Emblem.jsx                # small circular logo, falls back to an inline SVG
    NavBar.jsx                 # route links: Register / Tournament Details / Match Mechanics
    InfoPage.jsx                # shared layout/section/list primitives for info pages
    RegistrationForm.jsx      # form state, validation, submit handling
    SuccessPanel.jsx          # confirmation screen after a successful submit
  pages/
    RegisterPage.jsx           # registration card (route: /)
    DetailsPage.jsx             # overview, draw process, format, code of conduct (/details)
    MechanicsPage.jsx           # 3v3 match settings (/mechanics)
  App.jsx                    # routes + nav
  index.css                  # Tailwind entry + CSS variables for the palette
```
