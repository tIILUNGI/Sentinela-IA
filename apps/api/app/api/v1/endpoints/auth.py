from uuid import UUID

from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, decode_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.organization import Organization
from app.models.user import User, Membership, Role, PasswordResetToken
from app.schemas.auth import (
    LoginRequest, TokenResponse, RefreshRequest, MeResponse, UserOut, MembershipOut, RegisterRequest,
    ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest, MessageResponse,
    UpdateProfileRequest, ChangePasswordRequest,
)
from app.services.mailer import send_password_reset_email, smtp_configured

router = APIRouter()


def _slugify(name: str) -> str:
    import re
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
    return s or "org"


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    is_first = db.query(User).count() == 0
    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        status="active",
        is_superuser=is_first,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    org_name = payload.organization_name or ("Default Organization" if is_first else None)
    if org_name:
        base_slug = _slugify(org_name)
        slug = base_slug
        i = 1
        while db.query(Organization).filter(Organization.slug == slug).first():
            i += 1
            slug = f"{base_slug}-{i}"
        org = Organization(name=org_name.strip(), slug=slug, status="active")
        db.add(org)
        db.commit()
        db.refresh(org)

        role_name = "Organization Admin"
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            role = Role(name=role_name, description="Organization administration", permissions=["*"])
            db.add(role)
            db.commit()
            db.refresh(role)
        db.add(Membership(organization_id=org.id, user_id=user.id, role_id=role.id, status="active"))
        db.commit()

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user_id = UUID(data.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.get(User, user_id)
    if not user or user.status != "active":
        raise HTTPException(status_code=401, detail="User inactive or not found")
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.name = payload.name.strip()
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    current_user.password_hash = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return MessageResponse(message="Password updated successfully.")


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = (
        db.query(Membership, Organization, Role)
        .join(Organization, Membership.organization_id == Organization.id)
        .join(Role, Membership.role_id == Role.id)
        .filter(Membership.user_id == current_user.id, Membership.status == "active")
        .all()
    )
    ms = [
        MembershipOut(
            organization_id=m.organization_id,
            organization_name=o.name,
            role=r.name,
            permissions=r.permissions if isinstance(r.permissions, list) else [],
        )
        for m, o, r in memberships
    ]
    return MeResponse(user=UserOut.model_validate(current_user), memberships=ms)


@router.post("/logout")
def logout():
    return {"message": "Logged out"}


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Start a password reset.

    The response never reveals whether the email exists. When SMTP is not
    configured, development environments receive the single-use reset link so
    the flow can be completed without inventing a delivered email.
    """
    settings = get_settings()
    generic = "If this email is registered, a password reset link has been created."

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or user.status != "active":
        return ForgotPasswordResponse(message=generic)

    now = datetime.now(timezone.utc)
    # Invalidate previous unused tokens for this user.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).delete(synchronize_session=False)

    raw_token = secrets.token_urlsafe(48)
    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_reset_token(raw_token),
        expires_at=now + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
    ))
    db.commit()

    reset_url = f"{settings.APP_PUBLIC_URL.rstrip('/')}/reset-password?token={raw_token}"
    delivered = False
    try:
        delivered = send_password_reset_email(user.email, reset_url)
    except Exception as exc:  # SMTP failure must not leak account existence
        print(f"[mailer] password reset delivery failed: {exc}")

    if not delivered and settings.APP_ENV != "production":
        return ForgotPasswordResponse(message=generic, reset_url=reset_url)
    return ForgotPasswordResponse(message=generic)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = _hash_reset_token(payload.token)
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()
    if not record or record.used_at is not None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.get(User, record.user_id)
    if not user or user.status != "active":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.password_hash = get_password_hash(payload.new_password)
    record.used_at = datetime.now(timezone.utc)
    db.add(user)
    db.add(record)
    db.commit()
    return MessageResponse(message="Password updated. You can now sign in.")


@router.get("/forgot-password/status")
def password_reset_delivery_status():
    """Tells the UI whether reset emails are sent automatically."""
    return {"email_delivery": smtp_configured()}

