from fastapi import APIRouter

from app.api.v1.endpoints import auth, organizations, users, incidents, documents, evidence, risks, recommendations, tasks, audit, analytics, reports

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["evidence"])
api_router.include_router(risks.router, prefix="/risks", tags=["risks"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
