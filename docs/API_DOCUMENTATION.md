# API DOCUMENTATION

Base prefix: `/api/v1`  
Interactive docs: `/docs` (Swagger UI)

## Auth
- `POST /auth/register` - create user, optionally organization; first user becomes superuser
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/logout`

## Organizations
- `GET /organizations`
- `POST /organizations` (super admin)
- `GET /organizations/{id}`
- `PATCH /organizations/{id}`
- `GET /organizations/{id}/sectors`
- `POST /organizations/{id}/sectors`

## Users
- `GET /users`
- `POST /users`
- `PATCH /users/{id}`

## Incidents
- `GET /incidents`
- `POST /incidents`
- `GET /incidents/{id}`
- `PATCH /incidents/{id}`
- `POST /incidents/{id}/analyze`
- `GET /incidents/{id}/analysis`

## Documents
- `GET /documents`
- `POST /documents/upload` (multipart file)
- `GET /documents/{id}`
- `GET /documents/{id}/status`
- `POST /documents/{id}/analyze`
- `POST /documents/{id}/questions`

## Evidence
- `GET /evidence`
- `POST /evidence`
- `GET /evidence/{id}`
- `POST /evidence/correlate`

## Risks
- `GET /risks`
- `POST /risks/assess`
- `GET /risks/{id}`

## Recommendations
- `GET /recommendations`
- `POST /recommendations`
- `POST /recommendations/{id}/approve`
- `POST /recommendations/{id}/reject`

## Tasks
- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/{id}`

## Audit / Analytics / Reports
- `GET /audit`
- `GET /analytics/overview`
- `GET /analytics/incidents`
- `GET /analytics/risks`
- `GET /reports/incidents.csv`
- `GET /reports/risks.csv`
- `GET /reports/recommendations.csv`

## Headers

- `Authorization: Bearer <access_token>`
- `X-Organization-ID: <uuid>` (optional when user has one membership; required to target a specific org)
