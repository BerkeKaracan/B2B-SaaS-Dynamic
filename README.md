# B2B Multi-Tenant SaaS Engine

A modular, multi-tenant Software as a Service (SaaS) platform featuring a decoupled architecture. The frontend is built with Next.js, while the backend is powered by FastAPI and Supabase, designed for scalability and type safety.

## Architecture Overview

The system relies on a strict separation of concerns. The Next.js frontend handles state management and user interfaces, communicating with a FastAPI backend that acts as a secure gateway to the Supabase PostgreSQL database. This allows for flexible rate limiting, logging, and business logic execution outside the client layer.

## Tech Stack

**Frontend Layer:**

- Framework: Next.js (App Router)
- State Management: Zustand
- Styling: Tailwind CSS & Lucide React
- Language: TypeScript (Strict mode enabled)

**Backend & Database Layer:**

- API Framework: FastAPI (Python 3.12+)
- Data Validation: Pydantic v2
- Database: Supabase (PostgreSQL) with Row Level Security (RLS)
- Authentication: Supabase Auth / GoTrue Admin API

**Infrastructure & CI/CD:**

- Primary path: Docker & Docker Compose (frontend + backend images)
- CI: GitHub Actions (`ci.yml` — lint, build, pytest, Playwright)
- Optional backup demo: `db-backup.yml` (secrets-driven `pg_dump` → GitHub artifact; not production DR)
- Optional reference: `k8s/` manifests (AWS ALB Ingress samples — not the active deploy path)

## Key Features

- Multi-Tenant Isolation: Centralized resource and data separation per tenant to ensure data privacy.
- Interactive Modules: Built-in dynamic workspace tools including Kanban boards, Mindmaps, and Whiteboards.
- Automated CI/CD: Integrated GitHub Actions workflows for automated frontend builds and backend testing (pytest).
- Rate Limiting & Security: Configured at the FastAPI layer to prevent abuse and enforce API quotas.
- End-to-End Type Safety: Synchronized TypeScript definitions automatically generated from the Supabase schema to eliminate runtime data errors.

## Getting Started

### Prerequisites

- Node.js (v20+)
- Python (3.12+)
- Docker & Docker Compose
- Supabase Project Credentials

### Local Development Setup

1. Clone the repository:
   git clone [https://github.com/berkekaracan/b2b-saas-dynamic.git](https://github.com/berkekaracan/b2b-saas-dynamic.git)
   cd b2b-saas-dynamic

2. Environment Configuration:
   Copy the example environment files and update them with your targeted Supabase API credentials.
   cp .env.example .env
   cp backend/.env.example backend/.env

3. Launch Container Ecosystem:
   Use Docker Compose to build and run the services in the background.
   docker compose up -d --build

4. Monitor Backend Logs:
   docker logs b2b-backend -f

## Deployment model

**Supported / primary:** Docker Compose (and the two service Dockerfiles). This is what local and portfolio demos should use.

**CI:** `.github/workflows/ci.yml` verifies frontend and backend on every push/PR to `main`.

**Optional:**
- Database backup workflow — configure `SUPABASE_DB_HOST`, `SUPABASE_DB_USER`, and `SUPABASE_DB_PASSWORD` (plus optional port/name) as repository secrets. Uploads a nightly dump artifact; use Supabase PITR for real recovery.
- `k8s/` — reference manifests only; see [k8s/README.md](k8s/README.md).

## Project Directory Structure

````
.
├── backend/
│ ├── api/ # FastAPI routers (Auth, Tenants, Records, Notifications)
│ ├── core/ # DB Clients, Rate Limiters, and System Configuration
│ ├── models/ # Pydantic schemas for request/response validation
│ └── tests/ # Pytest test suite for health checks and route protection
├── src/
│ ├── app/ # Next.js App Router (Dashboard, Settings, Workspaces)
│ ├── components/ # Reusable UI components and layout fragments
│ ├── store/ # Zustand global state management
│ ├── types/ # TypeScript type definitions (including generated Supabase types)
│ └── middleware.ts # Multi-tenant edge domain interceptor
├── k8s/ # Optional Kubernetes reference manifests (not active deploy path)
└── .github/ # CI and optional backup workflows
````
