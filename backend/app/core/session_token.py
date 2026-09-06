import base64
import hashlib
import hmac
import json
from datetime import datetime, timezone

from .config import Config

SESSION_TTL_SECONDS = 8 * 60 * 60  # 8 hours


def _sign(payload: str) -> str:
    return hmac.new(
        Config.SECRET_KEY.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def create_session_token(payload: dict, ttl=SESSION_TTL_SECONDS) -> str:
    """Issues a signed, expiring session token embedding arbitrary claims."""
    data = dict(payload)
    data["exp"] = int(datetime.now(timezone.utc).timestamp()) + ttl
    body = _b64(json.dumps(data, separators=(",", ":")).encode())
    return f"{body}.{_sign(body)}"


def verify_session_token(token: str):
    """Returns the claims dict if the token is valid, else None."""
    token = (token or "").strip()
    parts = token.split(".")
    if len(parts) != 2:
        return None
    body, sig = parts
    if not hmac.compare_digest(_sign(body), sig):
        return None
    try:
        payload = json.loads(_unb64(body))
    except Exception:
        return None
    if isinstance(payload, dict) and datetime.now(timezone.utc).timestamp() < payload.get("exp", 0):
        return payload
    return None