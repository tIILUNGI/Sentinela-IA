from datetime import datetime, timedelta, timezone

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.audit import AuditLog
from app.models.document import Document, DocumentChunk
from app.models.evidence import Evidence
from app.models.incident import Incident, IncidentAnalysis
from app.models.organization import Organization
from app.models.recommendation import Recommendation
from app.models.risk import RiskAssessment
from app.models.task import ActionTask
from app.models.user import Membership, Role, User
from app.services.risk import calculate_risk_score


def seed_demo_data() -> None:
    """Populate a realistic demo organization and operational records if absent."""
    db = SessionLocal()
    try:
        demo_email = "demo@sentinela.ai"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            user = User(
                name="Helena Vance",
                email=demo_email,
                password_hash=get_password_hash("SentinelaDemo2026!"),
                status="active",
                is_superuser=True,
            )
            db.add(user)
            db.flush()

        org = db.query(Organization).filter(Organization.slug == "sentinela-ops").first()
        if not org:
            org = Organization(
                name="Sentinela Global Ops",
                slug="sentinela-ops",
                status="active",
                sector="Critical Infrastructure & Security",
            )
            db.add(org)
            db.flush()

        admin_role = db.query(Role).filter(Role.name == "Organization Admin").first()
        if admin_role:
            ms = (
                db.query(Membership)
                .filter(Membership.user_id == user.id, Membership.organization_id == org.id)
                .first()
            )
            if not ms:
                db.add(
                    Membership(
                        organization_id=org.id,
                        user_id=user.id,
                        role_id=admin_role.id,
                        status="active",
                    )
                )

        if db.query(Incident).filter(Incident.organization_id == org.id).count() > 0:
            db.commit()
            return

        now = datetime.now(timezone.utc)
        incidents_data = [
            ("Unauthorized API token replay on gateway EU-West", "Repeated bearer token replay detected from unrecognized ASN targeting telemetry ingestion endpoints.", "Cybersecurity", "Frankfurt DC-2", "SIEM Alert", "critical", "critical", "in_progress", 0),
            ("Substation B4 thermal sensor drift", "Transformer bay 4 telemetry reported +14C variance over baseline during peak load.", "Infrastructure", "Lisbon Grid B4", "SCADA", "high", "high", "open", 1),
            ("Unverified vendor access in archive vault", "Contractor badge accessed physical document room outside scheduled maintenance window.", "Compliance", "HQ Vault 1", "Access Control", "medium", "medium", "open", 2),
            ("Delayed customs manifest reconciliation", "Batch #4092 logistics manifest missing signed customs clearance attachment.", "Supply Chain", "Port Terminal 3", "ERP Sync", "medium", "low", "resolved", 3),
            ("TLS certificate expiration warning on partner webhook", "Partner callback endpoint certificate expires in 72 hours.", "Infrastructure", "Cloud Edge", "Cert Monitor", "low", "medium", "resolved", 4),
            ("Anomalous bulk export from compliance archive", "Service account exported 1,420 audit records outside regular reporting schedule.", "Data Governance", "Core DB", "DLP Sensor", "critical", "high", "open", 5),
        ]

        created_incidents: list[Incident] = []
        for title, desc, cat, loc, src, sev, prio, st, days_ago in incidents_data:
            inc = Incident(
                organization_id=org.id,
                created_by=user.id,
                title=title,
                description=desc,
                category=cat,
                location=loc,
                source=src,
                severity=sev,
                priority=prio,
                status=st,
                created_at=now - timedelta(days=days_ago, hours=2),
            )
            db.add(inc)
            db.flush()
            created_incidents.append(inc)

        db.add(
            IncidentAnalysis(
                organization_id=org.id,
                incident_id=created_incidents[0].id,
                summary="High-confidence token replay pattern originating from external ASN targeting telemetry endpoints.",
                suggested_category="Cybersecurity",
                suggested_severity="critical",
                missing_information=["ASN ownership verification", "Revocation status of compromised client ID"],
                justification="Correlates with SIEM anomaly burst and edge firewall rate-limit triggers.",
                recommended_next_steps=["Revoke active refresh tokens for affected service client", "Enforce IP allowlist on gateway EU-West"],
                status="completed",
            )
        )

        doc = Document(
            organization_id=org.id,
            uploaded_by=user.id,
            title="Operational Security & Incident Response SOP v3.2",
            file_name="sentinela_sop_v3.2.pdf",
            mime_type="application/pdf",
            storage_key="seed/sentinela_sop_v3.2.pdf",
            file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            page_count=12,
            status="ready",
        )
        db.add(doc)
        db.flush()

        db.add(
            DocumentChunk(
                organization_id=org.id,
                document_id=doc.id,
                chunk_index=0,
                page_number=4,
                content="Section 4.2 Token Compromise: Upon detecting bearer token replay, operators must revoke active sessions within 15 minutes and preserve gateway access logs.",
            )
        )

        ev_items = [
            ("Gateway EU-West Edge Access Log", "log", "Cloudflare WAF", "Captured 412 replayed authorization headers within 90 seconds.", created_incidents[0].id),
            ("SCADA Thermal Telemetry Snapshot", "report", "Substation B4 PLC", "Peak reading 89.4C recorded at 14:22 UTC.", created_incidents[1].id),
            ("Vault Badge Entry Audit", "document", "Physical Security", "Badge #C-8841 entry logged at 22:41 UTC.", created_incidents[2].id),
            ("DLP Export Query Trace", "log", "PostgreSQL Audit", "Bulk SELECT executed by svc-compliance-exporter.", created_incidents[5].id),
        ]
        for title, etype, src, desc, inc_id in ev_items:
            db.add(
                Evidence(
                    organization_id=org.id,
                    incident_id=inc_id,
                    title=title,
                    type=etype,
                    source=src,
                    description=desc,
                    created_by=user.id,
                )
            )

        risk_inputs = [
            (created_incidents[0].id, 5, 5, 4, 5, 4, "Active external token replay with corroborated WAF logs."),
            (created_incidents[1].id, 4, 4, 4, 4, 4, "Sustained thermal drift on primary transformer bay."),
            (created_incidents[5].id, 4, 5, 3, 5, 4, "Sensitive bulk export requires immediate DLP review."),
            (created_incidents[2].id, 2, 3, 3, 2, 3, "Single off-hours badge entry under review."),
        ]
        for inc_id, p, i, e, u, q, just in risk_inputs:
            res = calculate_risk_score(p, i, e, u, q)
            db.add(
                RiskAssessment(
                    organization_id=org.id,
                    incident_id=inc_id,
                    assessed_by=user.id,
                    probability=p,
                    impact=i,
                    exposure=e,
                    urgency=u,
                    evidence_quality=q,
                    score=res.score,
                    level=res.level,
                    requires_human_review=res.requires_human_review,
                    justification=just,
                )
            )

        recs = [
            (created_incidents[0].id, "Rotate gateway signing keys and block ASN", "Revoke compromised client credentials and apply temporary ASN rate-limit.", "critical", "pending", "Stops active replay vector immediately.", "May briefly disconnect legacy telemetry agents."),
            (created_incidents[1].id, "Shift 30% load off Substation B4", "Redistribute feeder load to B2 while inspecting cooling fans.", "high", "pending", "Prevents thermal trip during peak hours.", "Requires grid dispatch coordination."),
            (created_incidents[5].id, "Restrict bulk audit export to MFA-verified sessions", "Enforce step-up authentication for exports above 500 rows.", "high", "approved", "Mitigates silent data exfiltration.", "Minor friction for monthly compliance exports."),
        ]
        for inc_id, title, desc, prio, st, just, lim in recs:
            db.add(
                Recommendation(
                    organization_id=org.id,
                    incident_id=inc_id,
                    title=title,
                    description=desc,
                    priority=prio,
                    status=st,
                    justification=just,
                    limitations=lim,
                    generated_by="sentinela-seed",
                )
            )

        tasks = [
            ("Revoke compromised gateway client ID", "Invalidate tokens and rotate OAuth secret.", "in_progress"),
            ("Inspect Substation B4 cooling unit", "On-site thermal camera verification.", "open"),
            ("Verify contractor #C-8841 authorization", "Confirm work order with Facilities.", "open"),
            ("Archive customs manifest #4092", "Attach signed PDF to compliance vault.", "resolved"),
        ]
        for title, desc, st in tasks:
            db.add(ActionTask(organization_id=org.id, title=title, description=desc, status=st, created_by=user.id))

        audit_entries = [
            ("auth.login", "user", str(user.id)),
            ("incident.create", "incident", str(created_incidents[0].id)),
            ("document.upload", "document", str(doc.id)),
            ("recommendation.approve", "recommendation", "seed-rec-3"),
        ]
        for action, rtype, rid in audit_entries:
            db.add(AuditLog(organization_id=org.id, user_id=user.id, action=action, resource_type=rtype, resource_id=rid))

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
    print("Demo data seeded successfully.")
