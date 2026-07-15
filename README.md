# B2 SaaS Engine

**Portfolio / demo product (v1)** — a multi-tenant workspace OS built to show full-stack product engineering, not a commercial company.

There is **no real legal entity**, **no Stripe**, and **no real customers**. Names like “ACME Corp.” or “SaaS Engine Inc.” on the marketing surface are **intentionally fake** for the demo UI.

Live intent: LinkedIn / portfolio share with a working register → dashboard → Infinite canvas + board templates experience.

---

## What this is

| Layer | Role |
|-------|------|
| **Next.js** (App Router) | Marketing site, auth UI, dashboard, Infinite canvas, board templates |
| **FastAPI** | Secure API gateway (tenants, records, AI helpers, rate limits) |
| **Supabase** | Auth + PostgreSQL (RLS) |

**Workspace surfaces:** Infinite (blank + blocks), Kanban, Notepad/Document, Whiteboard, Mindmap, Timeline, Database, Retrospective — also usable as standalone project templates.

**Billing:** Demo only (tier flips / mock invoices). Real payments are **out of scope** for v1.

---

## Tech stack

- **Frontend:** Next.js, TypeScript, Zustand, Tailwind, next-intl, Yjs (collab)
- **Backend:** FastAPI, Pydantic v2, Redis (rate limiting)
- **Data / auth:** Supabase (Postgres + Auth)
- **CI:** GitHub Actions (`ci.yml` — lint, build, pytest, Playwright)
- **Deploy path:** Docker Compose (primary). `k8s/` is reference only.

---

## Quick start (Docker)

**Prerequisites:** Node 20+, Docker Compose, a Supabase project.

```bash
git clone https://github.com/BerkeKaracan/B2B-SaaS-Dynamic.git
cd B2B-SaaS-Dynamic

cp .env.example .env
cp backend/.env.example backend/.env
# Fill Supabase URL/keys in both files

docker compose up -d --build
```

- Frontend: http://localhost:3000  
- Backend docs: http://localhost:8000/docs  
- Backend logs: `docker logs b2b-backend -f`

### Local frontend without Docker

```bash
npm install
npm run dev
```

Backend still needs `backend/.env` and a running API (`uvicorn` or the Compose backend service).

---

## Environment checklist

### Frontend (`.env` — see [.env.example](.env.example))

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `NEXT_PUBLIC_SITE_URL` | **Prod yes** | Canonical URL for sitemap / robots / Open Graph (e.g. `https://your-domain.com`) |
| `NEXT_PUBLIC_API_URL` | Prod yes | Browser → API base (e.g. `https://api.your-domain.com`) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Optional | Tenant subdomain routing; defaults exist for local/demo |
| `INTERNAL_API_URL` | Docker | Set by Compose to `http://backend:8000` |
| `RESEND_API_KEY` | Optional | Email features |
| `SENTRY_AUTH_TOKEN` | Optional | Source maps / Sentry release |
| `NOTION_API_KEY` / `NOTION_PAGE_ID` | Optional | Notion export |
| `CSP_ALLOW_LOCALHOST` | Local only | Never on Vercel |

### Backend (`backend/.env` — see [backend/.env.example](backend/.env.example))

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `SUPABASE_URL` | Yes | Same project as frontend |
| `SUPABASE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Supabase access |
| `REDIS_URL` | Yes | Rate limiting |
| `GROQ_API_KEY` | Optional | AI routes |
| `GITHUB_TOKEN` / repo vars | Optional | GitHub integrations |

### Production share checklist

1. Set `NEXT_PUBLIC_SITE_URL` to the live HTTPS origin.
2. Validate the URL once with [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
3. Smoke: landing → Platform/Solutions → pricing → register → Infinite blank + Kanban.

---

## Demo caveats (honest v1)

- **Forgot password** — UI demo only (not a real reset flow).
- **Billing** — demo tiers; no Stripe.
- **Infinite** — Database / Retrospective / Timeline frames are page-scoped (isolated per frame), same pattern as Kanban.
- **Public share** — full board render for kanban / notepad / timeline; other types fall back to a simpler view.
- **Blog / community** — thin marketing stubs (real GitHub link; contact via mailto).

Privacy / legal pages already state this is a **portfolio demonstration**, not a commercial service.

---

## Repo layout

```
.
├── backend/          # FastAPI app, models, tests
├── src/              # Next.js app, components, stores
├── messages/         # en / tr i18n
├── k8s/              # Optional reference manifests (not primary deploy)
└── .github/workflows # ci.yml (+ optional db-backup.yml)
```

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production Next.js |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `docker compose up -d --build` | Full stack |

Backend tests: `pytest` under `backend/` (also run in CI).

---

## License / attribution

Built by **Berke Karacan** as an engineering portfolio project. Not affiliated with a real “SaaS Engine Inc.” entity.
