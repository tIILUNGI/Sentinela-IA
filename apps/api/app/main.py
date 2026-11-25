from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import get_settings
from app.core.localization import localize_detail
from app.db.session import engine
from app.db.base import Base
from app.api.v1.router import api_router
from app.db.session import SessionLocal
from app.db.seed_demo import seed_demo_data
from app.models.user import Role

DEFAULT_ROLES = [
    ("Super Admin", "Full platform access", ["*"]),
    ("Organization Admin", "Organization administration", ["org:read","org:update","users:manage","incidents:*","documents:*","evidence:*","risks:*","recommendations:*","tasks:*","audit:read","reports:*","analytics:read"]),
    ("Manager", "Operational management", ["org:read","incidents:*","documents:*","evidence:*","risks:*","recommendations:*","tasks:*","audit:read","reports:*","analytics:read"]),
    ("Analyst", "Analysis and investigation", ["org:read","incidents:read","incidents:create","incidents:update","incidents:analyze","documents:*","evidence:*","risks:*","recommendations:read","recommendations:create","tasks:read","tasks:update","analytics:read","reports:read"]),
    ("Operator", "Operational input", ["org:read","incidents:read","incidents:create","incidents:update","documents:read","documents:upload","evidence:read","evidence:create","tasks:read","tasks:update","analytics:read"]),
    ("Viewer", "Read-only access", ["org:read","incidents:read","documents:read","evidence:read","risks:read","recommendations:read","tasks:read","audit:read","analytics:read","reports:read"]),
]


def seed_roles():
    db = SessionLocal()
    try:
        for name, desc, perms in DEFAULT_ROLES:
            exists = db.query(Role).filter(Role.name == name).first()
            if not exists:
                db.add(Role(name=name, description=desc, permissions=perms))
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    # Ensure tables exist (dev/MVP convenience; Alembic also provided)
    try:
        if engine.dialect.name == "postgresql":
            with engine.begin() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        Base.metadata.create_all(bind=engine)
        seed_roles()
        if settings.APP_ENV == "development":
            seed_demo_data()
    except Exception as e:
        # Don't crash app startup in environments without DB; health endpoint will report.
        print(f"[startup] DB init warning: {e}")
    yield


settings = get_settings()
if settings.APP_ENV == "production" and settings.SECRET_KEY == "change-me-in-production":
    raise RuntimeError("SECRET_KEY must be configured with a strong secret in production")

app = FastAPI(title=settings.APP_NAME, version="0.1.0", lifespan=lifespan)


class SecurityHeadersMiddleware:
    """Pure ASGI middleware to attach HTTP security headers without buffering responses."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                raw_headers = list(message.get("headers", []))
                existing = {k.lower() for k, _ in raw_headers}
                extra = [
                    (b"x-content-type-options", b"nosniff"),
                    (b"x-frame-options", b"DENY"),
                    (b"referrer-policy", b"strict-origin-when-cross-origin"),
                    (b"permissions-policy", b"geolocation=(), microphone=(), camera=()"),
                ]
                message["headers"] = raw_headers + [(k, v) for k, v in extra if k not in existing]
            await send(message)

        await self.app(scope, receive, send_wrapper)


app.add_middleware(SecurityHeadersMiddleware)


@app.exception_handler(StarletteHTTPException)
async def localized_http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, str):
        detail = localize_detail(detail, request.headers.get("accept-language"))
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail},
        headers=getattr(exc, "headers", None),
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok", "service": "sentinela-api"}
