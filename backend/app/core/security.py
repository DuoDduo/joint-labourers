"""Password hashing, JWTs, refresh tokens, TOTP and field-level encryption."""

import base64
import hashlib
import os
import secrets
from datetime import UTC, datetime, timedelta

import jwt
import pyotp
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import get_settings

_hasher = PasswordHasher()
_ALGO = "HS256"


# ── Passwords ────────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except VerificationError:
        return False


# ── Access tokens (short-lived JWT) ──────────────────────────────────────────
def create_access_token(user_id: str, roles: list[str]) -> str:
    s = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "roles": roles,
        "typ": "access",
        "iat": now,
        "exp": now + timedelta(minutes=s.access_token_minutes),
    }
    return jwt.encode(payload, s.jwt_secret, algorithm=_ALGO)


def decode_access_token(token: str) -> dict[str, object] | None:
    try:
        data: dict[str, object] = jwt.decode(token, get_settings().jwt_secret, algorithms=[_ALGO])
    except jwt.PyJWTError:
        return None
    return data if data.get("typ") == "access" else None


# ── Refresh tokens / magic links (opaque, stored hashed) ─────────────────────
def new_opaque_token() -> tuple[str, str]:
    """Return (raw_token_for_client, sha256_hash_for_db)."""
    raw = secrets.token_urlsafe(48)
    return raw, hash_token(raw)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


# ── TOTP (staff 2FA) ─────────────────────────────────────────────────────────
def new_totp_secret() -> str:
    return pyotp.random_base32()


def totp_uri(secret: str, email: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name="JLICI Admin")


def verify_totp(secret: str, code: str) -> bool:
    return pyotp.TOTP(secret).verify(code, valid_window=1)


# ── Field-level encryption (AES-256-GCM) ─────────────────────────────────────
def _key() -> bytes:
    return hashlib.sha256(get_settings().field_encryption_key.encode()).digest()


def encrypt_field(plaintext: str) -> str:
    nonce = os.urandom(12)
    ct = AESGCM(_key()).encrypt(nonce, plaintext.encode(), None)
    return base64.urlsafe_b64encode(nonce + ct).decode()


def decrypt_field(token: str) -> str:
    raw = base64.urlsafe_b64decode(token.encode())
    return AESGCM(_key()).decrypt(raw[:12], raw[12:], None).decode()
