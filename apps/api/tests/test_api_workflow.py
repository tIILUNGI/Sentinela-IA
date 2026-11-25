import os
import tempfile
import unittest

_TMP_DB = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_TMP_DB.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB.name.replace(chr(92), '/')}"
os.environ["APP_ENV"] = "test"
os.environ["AI_API_KEY"] = ""

from fastapi import HTTPException  # noqa: E402

from app.api.deps import get_current_org, get_current_user, has_permission  # noqa: E402
from app.api.v1.endpoints.analytics import overview  # noqa: E402
from app.api.v1.endpoints.audit import list_audit_logs  # noqa: E402
from app.api.v1.endpoints.auth import change_password, login, me, refresh, register, update_me  # noqa: E402
from app.api.v1.endpoints.evidence import correlate_evidence, create_evidence  # noqa: E402
from app.api.v1.endpoints.incidents import create_incident, list_incidents, update_incident  # noqa: E402
from app.api.v1.endpoints.recommendations import approve_recommendation, create_recommendation  # noqa: E402
from app.api.v1.endpoints.reports import _safe_csv_cell, export_incidents_csv  # noqa: E402
from app.api.v1.endpoints.risks import assess_risk  # noqa: E402
from app.api.v1.endpoints.tasks import create_task, update_task  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.seed_demo import seed_demo_data  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app, seed_roles  # noqa: E402
from app.schemas.auth import (  # noqa: E402
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    UpdateProfileRequest,
)
from app.schemas.evidence import EvidenceCreate  # noqa: E402
from app.schemas.incident import IncidentCreate, IncidentUpdate  # noqa: E402
from app.schemas.recommendation import RecommendationCreate, RecommendationReview  # noqa: E402
from app.schemas.risk import RiskAssessmentCreate  # noqa: E402
from app.schemas.task import TaskCreate, TaskUpdate  # noqa: E402


class SentinelaWorkflowTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        seed_roles()

    @classmethod
    def tearDownClass(cls):
        engine.dispose()
        if os.path.exists(_TMP_DB.name):
            os.remove(_TMP_DB.name)

    def test_01_rbac_and_csv_sanitization(self):
        self.assertTrue(has_permission("Organization Admin", "incidents:delete"))
        self.assertFalse(has_permission("Viewer", "incidents:create"))
        self.assertEqual(_safe_csv_cell("=CMD()"), "'=CMD()")
        self.assertEqual(_safe_csv_cell("+1+1"), "'+1+1")
        self.assertEqual(_safe_csv_cell("normal"), "normal")
        self.assertEqual(app.title, "SENTINELA AI")

    def test_02_demo_seed_is_idempotent(self):
        seed_demo_data()
        seed_demo_data()
        with SessionLocal() as db:
            tok = login(LoginRequest(email="demo@sentinela.ai", password="SentinelaDemo2026!"), db=db)
            user = get_current_user(token=tok.access_token, db=db)
            org = get_current_org(x_organization_id=None, current_user=user, db=db)
            ov = overview(db=db, org=org, _=True)
            self.assertEqual(ov["metrics"]["total_incidents"], 6)
            self.assertGreaterEqual(ov["metrics"]["evidence_items"], 4)

    def test_03_end_to_end_operational_workflow(self):
        with SessionLocal() as db:
            reg = register(
                RegisterRequest(
                    name="Alice Operator",
                    email="alice@sentinela-ops.com",
                    password="StrongPassword123!",
                    organization_name="Sentinela Ops Test",
                ),
                db=db,
            )
            user = get_current_user(token=reg.access_token, db=db)
            me_res = me(current_user=user, db=db)
            org_id = me_res.memberships[0].organization_id
            org = get_current_org(x_organization_id=str(org_id), current_user=user, db=db)

            upd = update_me(UpdateProfileRequest(name="Alice Commander"), current_user=user, db=db)
            self.assertEqual(upd.name, "Alice Commander")

            chg = change_password(
                ChangePasswordRequest(current_password="StrongPassword123!", new_password="NewStrongPassword456!"),
                current_user=user,
                db=db,
            )
            self.assertIn("Password updated", chg.message)

            with self.assertRaises(HTTPException):
                get_current_user(token="invalid.jwt.token", db=db)

            ref = refresh(RefreshRequest(refresh_token=reg.refresh_token), db=db)
            self.assertTrue(bool(ref.access_token))

            inc1 = create_incident(
                IncidentCreate(
                    title='=HYPERLINK("http://evil.test","Click")',
                    description="Unauthorized access attempt detected on gateway node 04.",
                    category="security",
                    location="Region-A",
                    source="SIEM",
                    severity="critical",
                    priority="high",
                ),
                db=db,
                current_user=user,
                org=org,
                _=True,
            )
            create_incident(
                IncidentCreate(
                    title="Gateway node 04 credential anomaly",
                    description="Multiple failed SSH logins on gateway node 04 from external IP.",
                    category="security",
                    severity="high",
                    priority="high",
                ),
                db=db,
                current_user=user,
                org=org,
                _=True,
            )

            patched = update_incident(
                inc1.id,
                IncidentUpdate(status="in_progress"),
                db=db,
                current_user=user,
                org=org,
                _=True,
            )
            self.assertEqual(patched.status, "in_progress")

            filtered = list_incidents(status=None, severity="critical", q=None, db=db, current_user=user, org=org, _=True)
            self.assertEqual(len(filtered), 1)

            ev = create_evidence(
                EvidenceCreate(
                    title="Firewall Auth Log",
                    type="log",
                    source="fw-04",
                    description="Captured failed SSH authentication bursts on gateway node 04.",
                ),
                db=db,
                current_user=user,
                org=org,
                _=True,
            )
            self.assertEqual(ev.type, "log")

            corr = correlate_evidence({"incident_id": str(inc1.id)}, db=db, org=org, current_user=user, _=True)
            self.assertGreaterEqual(len(corr["suggestions"]), 1)

            risk = assess_risk(
                RiskAssessmentCreate(
                    incident_id=inc1.id,
                    probability=5,
                    impact=4,
                    exposure=4,
                    urgency=5,
                    evidence_quality=4,
                    justification="Corroborated by SIEM and firewall logs.",
                ),
                db=db,
                current_user=user,
                org=org,
                _=True,
            )
            self.assertIn(risk.level, ("high", "critical"))

            rec = create_recommendation(
                RecommendationCreate(
                    incident_id=inc1.id,
                    title="Isolate gateway node 04",
                    description="Block external SSH and rotate keys.",
                    priority="critical",
                    justification="Active brute force.",
                    limitations="Requires maintenance window.",
                ),
                db=db,
                current_user=user,
                org=org,
                _=True,
            )
            app_rec = approve_recommendation(
                rec.id,
                RecommendationReview(review_notes="Approved by duty commander."),
                db=db,
                current_user=user,
                org=org,
                _=True,
            )
            self.assertEqual(app_rec.status, "approved")

            task = create_task(
                TaskCreate(title="Rotate SSH keys on node 04", description="Execute key rotation.", status="open"),
                db=db,
                current_user=user,
                org=org,
                _=True,
            )
            upd_task = update_task(
                task.id,
                TaskUpdate(status="resolved"),
                db=db,
                current_user=user,
                org=org,
                _=True,
            )
            self.assertEqual(upd_task.status, "resolved")

            ov = overview(db=db, org=org, _=True)
            self.assertEqual(ov["metrics"]["total_incidents"], 2)
            self.assertEqual(ov["metrics"]["critical_incidents"], 1)
            self.assertEqual(ov["metrics"]["evidence_items"], 1)

            csv_resp = export_incidents_csv(db=db, org=org, _=True)
            self.assertEqual(csv_resp.media_type, "text/csv")

            logs = list_audit_logs(action=None, resource_type=None, db=db, org=org, _=True)
            actions = {l.action for l in logs}
            self.assertIn("incident.create", actions)
            self.assertIn("recommendation.approve", actions)
