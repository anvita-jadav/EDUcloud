import hmac
import hashlib
from datetime import datetime, timezone

from .config import Config

# Students can only check in within [starts_at, starts_at + duration].
# Allow a small grace period after the class ends to avoid flaking out.
GRACE_SECONDS = 120


def _sign(payload: str) -> str:
    return hmac.new(
        Config.SECRET_KEY.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()


def generate_qr_token(course_code: str, starts_at: int, duration_seconds: int) -> str:
    """Issues a signed token embedding the course code and the class window."""
    payload = f"{course_code}.{int(starts_at)}.{int(duration_seconds)}"
    return f"{payload}.{_sign(payload)}"


def verify_qr_token(token: str):
    """Returns a dict for ANY correctly-signed token:
        {'course_code', 'starts_at', 'duration', 'expired': bool}
    'expired' is True when the current time is outside the class window
    (including grace). Returns None only for an invalid signature."""
    token = (token or "").strip()
    parts = token.rsplit(".", 3)
    if len(parts) != 4:
        return None
    course_code, start_str, duration_str, sig = parts
    try:
        starts_at = int(start_str)
        duration = int(duration_str)
    except ValueError:
        return None
    payload = f"{course_code}.{start_str}.{duration_str}"
    if not hmac.compare_digest(_sign(payload), sig):
        return None
    now = int(datetime.now(timezone.utc).timestamp())
    ends_at = starts_at + duration
    inside = starts_at <= now <= ends_at + GRACE_SECONDS
    return {
        "course_code": course_code,
        "starts_at": starts_at,
        "duration": duration,
        "expired": not inside,
    }