"""Request dependencies: DB session, current user, role guards."""

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ProblemError
from app.core.security import decode_access_token
from app.db.session import get_session
from app.models.enums import STAFF_ROLES, Role
from app.models.identity import User

ACCESS_COOKIE = "jl_at"
REFRESH_COOKIE = "jl_rt"

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def _token_from(request: Request) -> str | None:
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:]
    return request.cookies.get(ACCESS_COOKIE)


async def current_user_optional(request: Request, session: SessionDep) -> User | None:
    token = _token_from(request)
    claims = decode_access_token(token) if token else None
    if not claims:
        return None
    user = await session.get(User, str(claims["sub"]))
    if user is None or user.deleted_at is not None:
        return None
    return user


async def current_user(
    user: Annotated[User | None, Depends(current_user_optional)],
) -> User:
    if user is None:
        raise ProblemError(401, "unauthenticated", "Please sign in")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def is_staff(user: User) -> bool:
    return bool(set(user.roles) & {r.value for r in STAFF_ROLES})


def require_roles(*roles: Role) -> Callable[[User], Awaitable[User]]:
    """Allow only users holding one of `roles`. Staff must have 2FA switched on."""
    allowed = {r.value for r in roles}

    async def _guard(user: CurrentUser) -> User:
        if not set(user.roles) & allowed:
            raise ProblemError(403, "forbidden", "You do not have access to this action")
        if is_staff(user) and not user.totp_enabled:
            raise ProblemError(403, "2fa-required", "Turn on two-factor sign-in to continue")
        return user

    return _guard
