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

- **Custom WebSocket Hub:** Live cursor tracking is handled by a custom FastAPI WebSocket implementation (`/ws/canvas/{room_id}`) backed by an in-memory room hub.
- **Architectural Pivot:** Supabase Presence was initially tested for cursor broadcasting but was abandoned in favor of the custom WebSocket approach due to connection instability (`CLOSED` states) in practice.
- **CRDT Synchronization:** Yjs and `y-protocols` are implemented for shared canvas editing. However, collaborative canvas sync (`collab.canvas_sync`) is currently disabled by default pending further validation of edge-case state resolutions.

### 3. Database Design

- **JSONB Document Storage:** Instead of heavily normalized relational tables for canvas nodes, project data (Blank, Kanban, etc.) is persisted as JSON documents in the `records.record_data` column. This allows the Zustand store to serialize complex UI states efficiently.
- **Multi-tenancy:** All core tables (`tenants`, `tenant_users`, `records`) are scoped via `tenant_id`.

## CI/CD and Deployment

The deployment pipeline is automated via GitHub Actions (`.github/workflows/deploy-backend.yml`):

1.  Code pushed to `main` triggers Vitest and Pytest test suites.
2.  The backend is containerized via Docker and pushed to Google Artifact Registry.
3.  The image is deployed to Google Cloud Run (`europe-west3`).

## Local Development (Docker)

Prerequisites: Node.js 20+, Docker Compose, and a Supabase project.

```bash
git clone [https://github.com/BerkeKaracan/B2B-SaaS-Dynamic.git](https://github.com/BerkeKaracan/B2B-SaaS-Dynamic.git)
cd B2B-SaaS-Dynamic

# Configure environment variables
cp .env.example .env
cp backend/.env.example backend/.env

# Build and start the cluster
docker compose up -d --build
```
