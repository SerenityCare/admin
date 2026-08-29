# Serenity Admin — Netlify deployment

Production admin domain: `https://admin.serenitycareservice.org`

Production API: `https://serenity-backend-mseu.onrender.com/api/admin`

## Netlify build settings

The repository contains `netlify.toml`, so Netlify can read these automatically:

- Build command: `npm run verify:deploy` (route verification, then Vite production build)
- Publish directory: `dist`
- Node: `22`
- Production API base: `https://serenity-backend-mseu.onrender.com/api/admin`
- Pretty URLs: enabled

## Public routes

- `/login` — Sign in
- `/dashboard` — Executive Control Center
- `/scheduling` — Scheduling & Workforce
- `/clinical` — Clinical Quality & Safety
- `/finance` — Finance & Growth
- `/operations?resource=<resource>` — Operational records
- `/reports` — Reports
- `/calendar` — Calendar
- `/inbox` — Website Inbox
- `/staff` — Staff & Access

The root `/` redirects to `/login`. Legacy `.html` URLs are redirected to the clean canonical routes.

## GitHub + Netlify

Repository: `https://github.com/SerenityCare/admin`

After pushing `main`, import the repository in Netlify. No manual build override is required unless Netlify has older conflicting settings saved in the UI.

Add the custom domain `admin.serenitycareservice.org`. If DNS is managed outside Netlify, point the `admin` CNAME to the Netlify site's `*.netlify.app` hostname shown in Domain management.
