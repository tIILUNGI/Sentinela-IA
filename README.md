<div align="center">

# SENTINELA AI

**From Evidence to Intelligence.**

[![Language: English](https://img.shields.io/badge/Language-English-1d63ed?style=for-the-badge)](README.md)
[![Idioma: Português](https://img.shields.io/badge/Idioma-Portugu%C3%AAs-0a1220?style=for-the-badge)](README.pt.md)

A multisectoral operational intelligence platform engineered to transform fragmented incidents, documents, and operational evidence into structured, traceable, and human-supervised decisions.

</div>

---

## Problem Statement & Alignment

Organizations operating in high-accountability environments (public administration, corporate security, compliance, and critical infrastructure) face three recurring operational bottlenecks:

1. **Fragmented operational records**: Incidents, supporting documents (PDF, DOCX, TXT), and field evidence live in disconnected tools without cross-referencing.
2. **Opaque AI outputs**: Generic assistants produce ungrounded summaries or invent risk scores without citing source documents or requiring human oversight.
3. **Weak auditability**: Operational decisions and status changes lack immutable-style audit trails linking who acted, what changed, and which evidence supported the conclusion.

**How SENTINELA AI addresses every requirement:**

- **Evidence-first RAG pipeline**: Uploaded documents are hashed (`SHA-256`), parsed, chunked, and indexed for retrieval-augmented Q&A with explicit page, chunk, and score citations.
- **Explicit AI availability states**: When `AI_API_KEY` is not configured or a provider is unreachable, endpoints return explicit unavailable errors instead of fabricated output.
- **Deterministic risk scoring**: Risk scores (`0-100`) and levels (`low`, `moderate`, `high`, `critical`) are computed deterministically from `probability`, `impact`, `exposure`, `urgency`, and `evidence_quality`, flagging low-evidence or high-severity cases for mandatory human review.
- **Human-in-the-loop governance**: Recommendations require explicit human approval or rejection with review notes, and critical actions are recorded in the organization's audit trail.
- **Standalone / Vercel Ready**: Works seamlessly both with the full FastAPI + PostgreSQL/pgvector backend and in frontend-only deployments (such as Vercel) using the built-in browser persistence engine (`localStorage`) pre-populated with realistic demo data.

---

## Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 4 | Responsive Command Center, Landing, Auth, and 10 Operational Modules |
| **State & Data** | TanStack React Query, Axios (with JWT refresh queue) | Caching, background polling for document processing, automatic token refresh |
| **Standalone Engine** | `localEngine.ts` (`localStorage`) | Full client-side persistence fallback for frontend-only deploys (Vercel) |
| **Charts** | Recharts | 7-day incident trend (Area), severity distribution (Bar), status breakdown (Pie) |
| **Backend API** | FastAPI, SQLAlchemy 2.0, Pydantic v2 | Multi-tenant REST API (`/api/v1`), RBAC enforcement, OpenAPI docs |
| **Database** | PostgreSQL + pgvector (SQLite supported for local/test) | Multi-tenant persistence and vector similarity search |
| **Document Pipeline** | PyMuPDF, python-docx, Tesseract OCR (optional) | Text extraction, page mapping, chunking, embedding generation |
| **Security** | JWT (Access + Refresh), bcrypt, ASGI Security Headers | Organization isolation via `X-Organization-ID`, CSV formula-injection protection |

---

## End-to-End Operational Workflow

1. **Landing & Authentication (`/`, `/login`, `/register`, `/forgot-password`, `/reset-password`)**: Bilingual (`EN / PT`) entry point with JWT access/refresh tokens, password reset flow, and one-click Demo Account access.
2. **Command Center (`/app`)**: Executive KPIs (total, open, critical, resolved incidents; ready documents; evidence records; average risk score; pending recommendations), interactive charts, recent activity feed, and one-click CSV intelligence exports.
3. **Incidents (`/app/incidents`)**: Structured incident intake, real-time filtering (`search`, `status`, `severity`), inline status updates, and AI-assisted structured analysis.
4. **Documents (`/app/documents`)**: Upload `PDF`, `DOCX`, or `TXT` with automatic status polling (`uploaded` -> `processing` -> `ready`), `SHA-256` integrity badge, reprocessing, and cited Q&A.
5. **Evidence & Correlation (`/app/evidence`)**: Evidence vault linked directly to organization incidents with cross-incident correlation suggestions.
6. **Risk Intelligence (`/app/risks`)**: Deterministic 5-factor risk assessment engine linked to incidents, with automatic human-review flags.
7. **Decision Support (`/app/recommendations`)**: Actionable recommendations with justification, limitations, status filtering, and human approve/reject workflow.
8. **Resolution Tasks (`/app/tasks`)**: Trackable remediation tasks with status transitions (`open`, `in_progress`, `resolved`, `closed`).
9. **Audit & Compliance (`/app/audit`)**: Filterable audit log (`action`, `resource_type`) covering authentication, mutations, analyses, and approvals.
10. **Profile & Security (`/app/profile`)**: Update user identity (`PATCH /auth/me`), change password (`POST /auth/change-password`), inspect organization RBAC permissions, and sign out securely.

---

## Demo Account & Pre-Populated Data

Both the backend development seed (`apps/api/app/db/seed_demo.py`) and the frontend standalone engine (`apps/web/src/lib/localEngine.ts`) ship with a ready-to-use Demo Account populated with incidents, analyses, documents, evidence, risk assessments, recommendations, tasks, and audit logs:

- **Email**: `demo@sentinela.ai`
- **Password**: `SentinelaDemo2026!`
- **Quick Login**: Click `Demo: demo@sentinela.ai` on `/login`

You can also create new accounts via `/register`; in frontend-only mode (e.g. Vercel), newly created accounts and all operational records are persisted in `localStorage`.

---

## Repository Structure

```text
sentinela-ai/
  apps/
    api/
      app/
        ai/              # AI provider abstraction and OpenAI-compatible adapter
        api/             # FastAPI dependencies (JWT, org isolation, RBAC) and v1 routers
        core/            # Settings, security utilities, localization
        db/              # SQLAlchemy base, session, portable types, demo seed
        models/          # Domain models (User, Organization, Incident, Document, Evidence, Risk, etc.)
        schemas/         # Pydantic request/response contracts
        services/        # Risk engine, document extraction/chunking, audit logger, mailer, storage
      tests/             # Unit and end-to-end API workflow tests
    web/
      src/
        components/      # Shared UI primitives, AuthShell, AppLayout, Brand Logo
        lib/             # Axios client with refresh & local fallback, AuthProvider, i18n (EN/PT)
        pages/           # Public pages and /app/* operational modules
      vercel.json        # SPA rewrite configuration for Vercel
  docs/                  # Technical documentation
  docker-compose.yml
  vercel.json            # Root Vercel deployment configuration
  .env.example
```

---

## Quick Start (Local Development)

### 1. Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose (optional, for PostgreSQL + pgvector)

### 2. Configure Environment

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Set `AI_API_KEY` in `.env` (never commit `.env`) to enable live AI incident analysis and document RAG synthesis. Without it, AI endpoints explicitly report unavailability rather than returning simulated results.

### 3. Run Backend API

```bash
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate | Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

- API Base: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 4. Run Frontend Web App

```bash
cd apps/web
npm install
npm run dev
```

- Web App: `http://localhost:5173`

---

## Deploying to Vercel (Frontend-Only or Full-Stack)

1. Import the GitHub repository into **Vercel**.
2. The root `vercel.json` automatically installs dependencies in `apps/web`, runs `npm run build`, serves `apps/web/dist`, and configures SPA rewrites (`/(.*) -> /index.html`).
3. **Frontend-only mode**: Without `VITE_API_URL` pointing to an external backend, SENTINELA AI automatically activates its client-side persistence engine (`localStorage`), allowing account registration, login, demo exploration, and full CRUD across all modules.
4. **Full-stack mode**: Deploy `apps/api` (e.g. Render, Railway, or Fly.io) with PostgreSQL and set `VITE_API_URL=https://your-api-domain.com/api/v1` in Vercel Environment Variables.

---

## Testing & Quality Verification

### Backend Tests

```bash
cd apps/api
python -m unittest discover -s tests -v
```

Covers deterministic risk scoring, RBAC permissions, CSV formula-injection protection, idempotent demo seeding, authentication lifecycle (register, profile update, password change, refresh), multi-tenant incident management, evidence correlation, recommendation approval, tasks, analytics aggregation, and audit logging.

### Frontend Lint & Production Build

```bash
cd apps/web
npm run lint
npm run build
```

---

## Security Highlights

- **Strict Multi-Tenancy**: Every workspace request is scoped by `X-Organization-ID` and validated against active user memberships.
- **RBAC Permissions**: Granular permission checks (`incidents:*`, `documents:*`, `risks:*`, `recommendations:*`, `audit:read`, `reports:*`) enforced at dependency level.
- **HTTP Security Headers**: Pure ASGI middleware injecting `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **CSV Export Hardening**: All exported CSV cells neutralize leading formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`).
- **Production Secret Guard**: Startup fails fast if `APP_ENV=production` is paired with the default `SECRET_KEY`.
