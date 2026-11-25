# SECURITY

## Implemented Controls

- **Password hashing**: bcrypt via passlib.
- **JWT auth**: access + refresh tokens, expiration, type validation.
- **RBAC**: backend `require_permission` dependency; role permissions seeded.
- **Tenant isolation**: org-scoped queries and `X-Organization-ID` validation against memberships.
- **Input validation**: Pydantic schemas, upload extension/size checks.
- **File safety**: storage keys resolved against base path to prevent traversal; private local storage.
- **CORS**: configured from environment.
- **Audit logs**: create/update/analyze/upload/approve/reject actions recorded.
- **Prompt injection awareness**: document content treated as untrusted; prompts instruct evidence-only behavior.

## Security Notes / MVP Tradeoffs

- Tokens stored in localStorage for MVP simplicity; production should consider httpOnly secure cookies + CSRF strategy.
- Rate limiting not fully implemented in-app; deploy behind API gateway/reverse proxy with rate limits.
- OCR/PDF parsing libraries should be kept updated.
- No secrets in frontend; AI keys are backend-only env vars.
- Refresh token rotation/revocation blacklist not implemented; can be added with Redis/DB.

## Recommendations for Production

- Enforce HTTPS/TLS everywhere.
- Add rate limiting, WAF, and request size limits at edge.
- Use managed secrets (Vault/Key Vault/Secrets Manager).
- Use S3-compatible private storage with signed URLs.
- Add malware scanning for uploads.
- Add structured logging without sensitive payloads.
- Perform regular dependency and security scans.
