# DEPLOYMENT

## Development

Use Docker Compose for PostgreSQL/pgvector and run API/web locally.

```bash
docker compose up -d postgres
# api
cd apps/api && uv sync && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
# web
cd apps/web && npm install && npm run dev
```

## Production Checklist

- Set strong `SECRET_KEY` and disable debug.
- Use managed PostgreSQL with backups and pgvector enabled.
- Use private object storage (S3-compatible) for documents.
- Run API behind HTTPS reverse proxy (Nginx/Caddy/Traefik).
- Configure CORS for production domains only.
- Set AI provider secrets in secure secret manager.
- Add rate limiting and monitoring.
- Run Alembic migrations during deploy.
- Serve frontend as static build (`npm run build`) via CDN/web server.

## Docker (suggested next step)

Add Dockerfiles for `apps/api` and `apps/web`, and extend `docker-compose.yml` with api/web services. The MVP repo includes infra baseline and env templates.

## Observability

- Add structured logs, request IDs, error tracking (Sentry/OpenTelemetry).
- Monitor DB, queue, AI provider latency/failures, and document processing status.
