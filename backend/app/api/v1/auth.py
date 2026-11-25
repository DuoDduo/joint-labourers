"""Auth: register, login (+TOTP), refresh rotation, logout, me, 2FA setup."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Request, Response
from sqlalchemy import select

from app.api.deps import ACCESS_COOKIE, REFRESH_COOKIE, CurrentUser, SessionDep, is_staff
from app.core.config import get_settings
from app.core.errors import ProblemError
from app.core.security import (
    create_access_token,
    decrypt_field,
    encrypt_field,
    hash_password,
    hash_token,
    new_opaque_token,
    new_totp_secret,
    totp_uri,
    verify_password,
    verify_totp,
)
from app.models.enums import Role
from app.models.identity import RefreshToken, User
from app.schemas.auth import (
    LoginIn,
    RegisterIn,
    SessionOut,
    TotpSetupOut,
    TotpVerifyIn,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])
_DUMMY_HASH = hash_password("timing-equaliser-not-a-real-password")


def _set_cookies(response: Response, access: str, refresh: str) -> None:
    s = get_settings()
    common = {
        "httponly": True,
        "secure": s.cookie_secure,
        "samesite": "lax",
        "domain": s.cookie_domain,
    }
    response.set_cookie(
        ACCESS_COOKIE, access, max_age=s.access_token_minutes * 60, path="/", **common
    )  # type: ignore[arg-type]
    response.set_cookie(
        REFRESH_COOKIE,
        refresh,
        max_age=s.refresh_token_days * 86400,
        path=f"{s.api_prefix}/auth",
        **common,  # type: ignore[arg-type]
    )


def _clear_cookies(response: Response) -> None:
    s = get_settings()
    response.delete_cookie(ACCESS_COOKIE, path="/", domain=s.cookie_domain)
    response.delete_cookie(REFRESH_COOKIE, path=f"{s.api_prefix}/auth", domain=s.cookie_domain)


async def _issue(session: SessionDep, response: Response, request: Request, user: User) -> None:
    raw, token_hash = new_opaque_token()
    session.add(
        RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            user_agent=(request.headers.get("user-agent") or "")[:255],
            ip=request.client.host if request.client else None,
            expires_at=datetime.now(UTC) + timedelta(days=get_settings().refresh_token_days),
        )
    )
    _set_cookies(response, create_access_token(user.id, list(user.roles)), raw)


def _session_out(user: User) -> SessionOut:
    return SessionOut(
        user=UserOut.model_validate(user),
        requires_two_factor_setup=is_staff(user) and not user.totp_enabled,
    )


@router.post("/register", response_model=SessionOut, status_code=201)
async def register(
    body: RegisterIn, session: SessionDep, request: Request, response: Response
) -> SessionOut:
    email = body.email.lower()
    if await session.scalar(select(User.id).where(User.email == email)):
        raise ProblemError(409, "email-taken", "An account with this email already exists")
    user = User(
        email=email,
        first_name=body.first_name,
        last_name=body.last_name,
        password_hash=hash_password(body.password),
        roles=[Role.PARTNER.value],
    )
    session.add(user)
    await session.flush()
    await _issue(session, response, request, user)
    await session.commit()
    return _session_out(user)


@router.post("/login", response_model=SessionOut)
async def login(
    body: LoginIn, session: SessionDep, request: Request, response: Response
) -> SessionOut:
    user = await session.scalar(select(User).where(User.email == body.email.lower()))
    ok = verify_password(
        body.password, user.password_hash if user and user.password_hash else _DUMMY_HASH
    )
    if not user or not ok or user.deleted_at is not None:
        raise ProblemError(401, "invalid-credentials", "Email or password is incorrect")
    if user.totp_enabled:
        if not body.totp:
            raise ProblemError(401, "totp-required", "Enter the 6-digit code from your app")
        if not user.totp_secret_enc or not verify_totp(
            decrypt_field(user.totp_secret_enc), body.totp
        ):
            raise ProblemError(401, "totp-invalid", "That code is not correct")
    user.last_login_at = datetime.now(UTC)
    await _issue(session, response, request, user)
    await session.commit()
    return _session_out(user)


@router.post("/refresh", response_model=SessionOut)
async def refresh(session: SessionDep, request: Request, response: Response) -> SessionOut:
    raw = request.cookies.get(REFRESH_COOKIE)
    token = (
        await session.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw)))
        if raw
        else None
    )
    now = datetime.now(UTC)
    if token is None or token.revoked_at is not None or token.expires_at.replace(tzinfo=UTC) < now:
        _clear_cookies(response)
        raise ProblemError(401, "session-expired", "Please sign in again")
    user = await session.get(User, token.user_id)
    if user is None or user.deleted_at is not None:
        raise ProblemError(401, "session-expired", "Please sign in again")
    token.revoked_at = now  # rotate
    await _issue(session, response, request, user)
    await session.commit()
    return _session_out(user)


@router.post("/logout", status_code=204)
async def logout(session: SessionDep, request: Request, response: Response) -> Response:
    raw = request.cookies.get(REFRESH_COOKIE)
    if raw:
        token = await session.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw))
        )
        if token and token.revoked_at is None:
            token.revoked_at = datetime.now(UTC)
            await session.commit()
    _clear_cookies(response)
    response.status_code = 204
    return response


@router.get("/me", response_model=SessionOut)
async def me(user: CurrentUser) -> SessionOut:
    return _session_out(user)


@router.post("/2fa/setup", response_model=TotpSetupOut)
async def totp_setup(user: CurrentUser, session: SessionDep) -> TotpSetupOut:
    if user.totp_enabled:
        raise ProblemError(409, "2fa-already-on", "Two-factor sign-in is already on")
    secret = new_totp_secret()
    user.totp_secret_enc = encrypt_field(secret)
    await session.commit()
    return TotpSetupOut(secret=secret, otpauth_uri=totp_uri(secret, user.email))


@router.post("/2fa/verify", response_model=SessionOut)
async def totp_verify(body: TotpVerifyIn, user: CurrentUser, session: SessionDep) -> SessionOut:
    if not user.totp_secret_enc or not verify_totp(decrypt_field(user.totp_secret_enc), body.code):
        raise ProblemError(400, "totp-invalid", "That code is not correct")
    user.totp_enabled = True
    await session.commit()
    return _session_out(user)
