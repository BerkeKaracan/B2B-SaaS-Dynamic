# B2B Multi-Tenant SaaS Dynamic Engine

An enterprise-grade, highly scalable multi-tenant SaaS foundation built with a strict focus on absolute type safety, dynamic subdomain isolation, and centralized resource quota enforcement.

The platform couples a robust, decoupled FastAPI backend with a minimalist, high-performance frontend architecture, presenting polished **Central Dashboard Hubs** tailored for premium enterprise workflows.

---

## 🚀 Technical Stack

### Frontend Layer

- **Core Framework:** Next.js (App Router) & TypeScript (Strict ESLint & null-safety configuration)
- **State Architecture:** Zustand (Decoupled, high-performance global store synchronization)
- **Interface Design:** Tailwind CSS & Lucide React (Monochromatic, low-latency premium UI system)

### Backend & Database Layer

- **API Framework:** FastAPI (Python 3.12+) & Pydantic v2 (Strict compile-time type validation & serialization)
- **Authentication & Core DB:** Supabase (PostgreSQL engine with Row Level Security policies)
- **Privileged Access:** Supabase GoTrue Admin API (Omission of session hazards during core account operations)
- **Orchestration:** Docker Compose & Kubernetes ready (AWS ALB Ingress manifests included)

---

## 🏗️ Core Architectural Highlights

### 1. Polished & High-Performance Dashboard Hubs

Upon authentication, users are welcomed by a centralized, lightweight administrative hub summarizing workspaces, subscription metrics, and active project distributions. Engineered for minimal time-to-first-byte (TTFB), these control hubs utilize optimized Next.js structures and Zustand handlers to eliminate redundant renders and secure instantaneous cross-layout transitions.

### 2. Dynamic Subdomain Isolation & Rewriting

The routing engine utilizes an advanced Next.js `middleware.ts` interceptor that evaluates host headers at the network edge. Custom subdomains (e.g., `client.domain.com`) are dynamically validated against the underlying tenant registry, triggering transparent server-side rewrites to encapsulate workspace data scopes seamlessly without causing client-side route flickering.

### 3. Bulletproof Python-Driven Quota Enforcement

Plan tiers (Basic, Advanced, Pro) and user seats are guarded strictly at the backend level. Unlike naïve client-side or raw database count checks, resource creation hooks execute direct, isolated collection tallies across all legacy and current modules. Exceeding tier limitations immediately drops a `403 Forbidden` response, captured gracefully by type-safe frontend catch blocks to surface immediate validation alerts.

### 4. Zero-Session Leak Security & Asset Pipeline

Critical account adjustments—such as identity modifications and password changes—bypass standard row-level session conflicts by operating through a dedicated Supabase Admin client pipeline. Profile assets and brand logos are securely processed via Supabase Storage buckets, utilizing public URL generation combined with Next.js `Image` lazy-loading optimizers.

---

## 🛠️ Local Development & Orchestration

The workspace is fully containerized for identical local and production testing environments.

### Orchestration Commands

1. **Clone Repository:**

   ```bash
   git clone [https://github.com/berkekaracan/b2b-saas-dynamic.git](https://github.com/berkekaracan/b2b-saas-dynamic.git)
   cd b2b-saas-dynamic
   ```

2. **Configuration Setup:**
   Populate environment flags inside root `.env` and `backend/.env` files with your targeted Supabase API credentials (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

3. **Launch Container Ecosystem (SFC No-Cache Build):**

   ```bash
   docker-compose -f docker-compose.dev.yml up -d --build
   ```

4. **Stream Server Diagnostics:**
   ```bash
   docker logs b2b-backend-dev -f
   ```

---

## 📂 Project Directory Structure

```text
├── backend/
│   ├── api/
│   │   └── routers/       # Auth, Tenant Provisioning, Records, and Notification endpoints
│   ├── core/              # DB Clients, Rate Limiters, and Global System Config
│   ├── models/            # Pydantic schemas enforcing type-safety across requests
│   └── main.py            # FastAPI entrypoint & middleware mounting
├── src/
│   ├── app/               # Next.js App Router workspace (Dashboard, Billing, Security)
│   ├── components/        # Highly atomic presentation UI fragments & layout frames
│   ├── store/             # Zustand global state hubs managing synchronous auth states
│   └── middleware.ts      # Multi-tenant edge domain interceptor and gateway routing
├── k8s/                   # Cloud-native Kubernetes deployment & Ingress topologies
└── docker-compose.dev.yml # Local multi-container development manifest
```
