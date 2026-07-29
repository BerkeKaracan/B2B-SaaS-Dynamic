# Workspace OS - B2B SaaS Architecture Demonstration

**Version:** 1.3.0  
**Repository:** BerkeKaracan/B2B-SaaS-Dynamic

## Overview

This repository contains the source code for a multi-tenant workspace operating system. It is engineered as a portfolio demonstration to showcase a production-grade Full-Stack architecture handling tenancy, real-time synchronization, and containerized deployments.

Please note: This is a technical demonstration. There is no commercial entity, and billing/payment gateways are mocked.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Zustand, Tailwind CSS 4
- **Backend:** FastAPI, Pydantic v2, Uvicorn
- **Database & Auth:** PostgreSQL (via Supabase), Supabase Auth
- **Caching & Rate Limiting:** Redis
- **Infrastructure:** Docker, Google Cloud Run, GitHub Actions

## System Architecture & Engineering Decisions

The system is decoupled into a Next.js frontend and a FastAPI backend gateway to ensure secure data processing and scalable real-time connections.

### 1. Authentication & Security Flow

- **HttpOnly Cookies:** JWTs are not stored in `localStorage`. The Next.js layer establishes an HttpOnly `token` cookie via `/api/session`.
- **BFF (Backend-For-Frontend) Pattern:** Browser API calls route through the Next.js proxy (`/api/backend/*`), attaching the JWT securely before forwarding to FastAPI.
- **Data Access:** The FastAPI backend utilizes the Supabase `service_role` to bypass default constraints, strictly enforcing tenant data isolation within the application logic layer. Postgres Row Level Security (RLS) is maintained as a defense-in-depth measure.

### 2. Real-Time Infrastructure (Canvas & Cursors)

- **Custom WebSocket Hub:** Live cursors (+ optional Yjs co-edit) go through FastAPI `/ws/canvas/{room_id}` (in-memory room hub).
- **Architectural Pivot:** Supabase Presence was tried for cursors, then replaced after unstable `CLOSED` / channel races.
- **CRDT Synchronization:** Yjs over the same WebSocket. Local Docker can force sync with `NEXT_PUBLIC_COLLAB_DOC_SYNC=true`; Pulse flag `collab.canvas_sync` remains the prod kill-switch.

### 3. Database Design

- **JSONB Document Storage:** Instead of heavily normalized relational tables for canvas nodes, project data (Blank, Kanban, etc.) is persisted as JSON documents in the `records.record_data` column. This allows the Zustand store to serialize complex UI states efficiently.
- **Multi-tenancy:** All core tables (`tenants`, `tenant_users`, `records`) are scoped via `tenant_id`.

## CI/CD and Deployment

The deployment pipeline is automated via GitHub Actions (`.github/workflows/deploy-backend.yml`):

1. Code pushed to `main` triggers Vitest and Pytest test suites.
2. The backend is containerized via Docker and pushed to Google Artifact Registry.
3. The image is deployed to Google Cloud Run (`europe-west3`).

## Local Development (Docker)

Prerequisites: Node.js 20+, Docker Compose, and a Supabase project.

```bash
git clone https://github.com/BerkeKaracan/B2B-SaaS-Dynamic.git
cd B2B-SaaS-Dynamic

cp .env.example .env
cp backend/.env.example backend/.env

docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs
- Backend logs: `docker logs b2b-backend -f`

## Production env (Vercel + Cloud Run LIVE)

Set these on Vercel **before** rebuild (values are baked into the client + CSP):

| Variable | Example | Notes |
|----------|---------|--------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-SERVICE-xxxxx.run.app` | HTTPS API origin |
| `NEXT_PUBLIC_WS_URL` | `wss://YOUR-SERVICE-xxxxx.run.app` | Same host, `wss://` scheme — canvas LIVE |
| `NEXT_PUBLIC_SITE_URL` | `https://your-frontend.vercel.app` | Canonical site URL |

CSP on Vercel omits `ws://localhost`. `connect-src` keeps `https:` / `wss:` and also lists the WS/API host from the vars above. Without `NEXT_PUBLIC_WS_URL` (or API URL), the client will **not** guess `frontend:8000`.

Cloud Run must accept WebSocket upgrades on `/ws/canvas/{room_id}` (same service as the HTTP API).

## Feedback & support

[https://feedback-portal-lyart.vercel.app/?tenant=b2-b-saa-s-dynamic](https://feedback-portal-lyart.vercel.app/?tenant=b2-b-saa-s-dynamic)

## License / attribution

Built by **Berke Karacan** as an engineering portfolio project. Not affiliated with a real commercial “SaaS Engine Inc.” entity.
