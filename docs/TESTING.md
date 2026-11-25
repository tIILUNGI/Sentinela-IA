# TESTING

## Backend

### Install dev deps
```bash
cd apps/api
uv sync --extra dev
```

### Run tests
```bash
uv run pytest
```

## Frontend

```bash
cd apps/web
npm run build
```

## Recommended Test Coverage

- Auth: register/login/refresh/me, invalid credentials, inactive user.
- RBAC: role permission enforcement.
- Tenant isolation: user cannot access another org's resources.
- Incidents: CRUD, analysis endpoint behavior when AI unavailable.
- Documents: upload validation, extraction, chunking, Q&A citations.
- Risk: deterministic score calculation boundaries.
- Recommendations: approve/reject state transitions and audit.
- Audit: logs created for critical operations.

## Current MVP Status

- Backend imports and frontend production build validated during implementation.
- Automated test suite should be expanded; core deterministic logic (risk scoring) is suitable for immediate unit tests.
