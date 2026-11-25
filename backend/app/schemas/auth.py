"""Auth request/response schemas."""

from pydantic import EmailStr, Field

from app.schemas.common import Schema


class RegisterIn(Schema):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str | None = Field(default=None, max_length=80)


class LoginIn(Schema):
    email: EmailStr
    password: str
    totp: str | None = Field(default=None, pattern=r"^\d{6}$")


class UserOut(Schema):
    id: str
    email: str
    first_name: str
    last_name: str | None
    roles: list[str]
    totp_enabled: bool


class SessionOut(Schema):
    user: UserOut
    requires_two_factor_setup: bool = False


class TotpSetupOut(Schema):
    secret: str
    otpauth_uri: str


class TotpVerifyIn(Schema):
    code: str = Field(pattern=r"^\d{6}$")
