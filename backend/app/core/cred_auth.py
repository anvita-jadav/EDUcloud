import hashlib
import hmac
import os

from .config import Config

_PBKDF2_ITERATIONS = 100_000
_PREFIX = "pbkdf2"


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), _PBKDF2_ITERATIONS
    ).hex()
    return f"{_PREFIX}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    if not stored:
        return False
    try:
        prefix, salt, digest = stored.split("$")
    except ValueError:
        return False
    if prefix != _PREFIX:
        return False
    calc = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), _PBKDF2_ITERATIONS
    ).hex()
    return hmac.compare_digest(calc, digest)


def validate_admin_credentials(username: str, password: str) -> bool:
    if not Config.ADMIN_USERNAME or not Config.ADMIN_PASSWORD:
        return False
    return (
        hmac.compare_digest((username or "").strip(), Config.ADMIN_USERNAME)
        and hmac.compare_digest(password or "", Config.ADMIN_PASSWORD)
    )