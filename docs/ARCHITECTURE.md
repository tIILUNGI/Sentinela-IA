# ARCHITECTURE

## Overview

SENTINELA AI is a monorepo with a React frontend and FastAPI backend.

```text
apps/web  -> UI, routing, auth state, API consumption
apps/api  -> REST API, RBAC, business logic, AI orchestration, persistence
PostgreSQL + pgvector -> relational data + embeddings
Local/S3-compatible storage -> private document files
```

## Backend Layers

- `app/core`: config, security (JWT/password hashing)
- `app/db`: SQLAlchemy base/session
- `app/models`: ORM models
- `app/schemas`: Pydantic contracts
- `app/api/v1`: REST endpoints by domain
- `app/services`: audit, storage, document processing, risk scoring
- `app/ai`: provider abstraction and OpenAI-compatible provider

## Frontend Layers

- `src/lib`: API client, auth context, utilities
- `src/components`: UI primitives and layout
- `src/pages`: public pages and protected app modules

## Multi-Tenancy & RBAC

- Every organizational resource includes `organization_id`.
- Backend resolves current org via `X-Organization-ID` header or user membership.
- Permissions are enforced by `require_permission` dependency; frontend checks are UX only.

## Data Flow

1. User authenticates and receives JWT.
2. Frontend sends requests with Bearer token and org header.
3. Backend validates identity, membership, permission, and tenant scope.
4. Domain services persist data and write audit logs.
5. AI services call configured provider; unavailable AI returns explicit errors.

## Document/RAG Flow

Upload -> validation -> storage -> extraction -> chunking -> embeddings -> pgvector -> retrieval -> LLM answer -> citations returned.

## Key Decisions

- **SQLAlchemy sync + psycopg**: reliable MVP; can evolve to async.
- **pgvector**: keeps embeddings close to relational data.
- **Deterministic risk scoring**: final score computed by code, not LLM.
- **AI provider abstraction**: config-driven provider selection.
- **BackgroundTasks for MVP**: simple async processing; Redis/Celery optional for scale.
