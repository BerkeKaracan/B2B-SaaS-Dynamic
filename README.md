# WORKSPACE OS

**Version:** 1.6.0 | **Repository:** BerkeKaracan/B2B-SaaS-Dynamic

Welcome to **WORKSPACE OS** — a production-grade, multi-tenant workspace operating system. This repository serves as a comprehensive portfolio demonstration showcasing advanced full-stack architecture, real-time synchronization, and scalable cloud deployments.

_Please note: This is a technical demonstration built by Berke Karacan. There is no commercial entity, and billing/payment gateways are mocked._

## 🚀 Core Features

- **Real-Time Collaboration:** Powered by a custom WebSocket hub, the platform supports live cursors and Yjs CRDT synchronization for seamless multi-user co-editing on the same canvas.
- **Multi-Tenant Data Isolation:** Engineered for B2B security, all core tables (tenants, users, records) are strictly scoped via `tenant_id` and backed by PostgreSQL Row Level Security (RLS).
- **Enterprise-Grade Authentication:** Implements the Backend-For-Frontend (BFF) pattern using HttpOnly cookies for JWTs, ensuring tokens are never exposed in local storage.
- **Dynamic UI & Storage:** Utilizes PostgreSQL JSONB document storage instead of rigid relational tables, allowing the Next.js frontend to efficiently serialize and save complex layouts like Kanban boards and infinite canvases.
- **Automated Cloud Infrastructure:** The backend is fully containerized with Docker, automatically tested via GitHub Actions, and deployed to Google Cloud Run.

## 💻 The Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Zustand, Tailwind CSS 4
- **Backend:** FastAPI, Pydantic v2, Uvicorn, Redis (for caching & rate limiting)
- **Database & Auth:** PostgreSQL (via Supabase), Supabase Auth
- **Infrastructure:** Docker, Google Cloud Run, GitHub Actions

## 💬 Feedback & Support

I would love to hear your thoughts. You can leave your feedback or report issues via the portal below:
[https://feedback-portal-lyart.vercel.app/?tenant=b2-b-saa-s-dynamic](https://feedback-portal-lyart.vercel.app/?tenant=b2-b-saa-s-dynamic)

---

_Built by **Berke Karacan** as an engineering portfolio project._
