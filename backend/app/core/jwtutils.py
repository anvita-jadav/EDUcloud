from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from . import firebase
from .firestore_utils import UserRecord, get_user_by_uid
from . import session_token

security = HTTPBearer(auto_error=False)


def parse_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials

    # 1) Firebase token (students).
    try:
        decoded = firebase.verify_token(token)
        uid = decoded.get("uid")
        if not uid:
            raise HTTPException(status_code=401, detail="Token missing subject")
        return {
            "uid": uid,
            "email": decoded.get("email", ""),
            "name": decoded.get("name", ""),
            "role": None,
            "auth_type": "firebase",
        }
    except HTTPException:
        raise
    except Exception:
        pass

    # 2) Backend-issued session token (faculty/admin).
    payload = session_token.verify_session_token(token)
    if payload and payload.get("uid"):
        return {
            "uid": payload["uid"],
            "email": payload.get("email", ""),
            "name": payload.get("name", ""),
            "role": payload.get("role"),
            "auth_type": "credentials",
        }

    raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    payload: dict = Depends(parse_token),
):
    uid = payload.get("uid")
    user = get_user_by_uid(uid)
    if not user:
        raise HTTPException(status_code=401, detail="User not found. Register first.")
    return UserRecord(user)


def require_role(*roles):
    def dependency(current_user: UserRecord = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return dependency