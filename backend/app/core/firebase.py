import os
import base64
import json
import threading
import firebase_admin
from firebase_admin import credentials, auth as fb_auth, firestore
from .config import Config

_app = None
_db = None
# RLock: get_db() is called first from a cold start and calls get_app()
# internally while holding the lock, so a reentrant lock is required.
_lock = threading.RLock()


def get_credentials():
    # Prefer a base64-encoded service account JSON (useful on Render where the
    # key is injected as a secret env var rather than a checked-in file).
    b64 = Config.FIREBASE_SERVICE_ACCOUNT_B64 or ""
    if b64:
        try:
            raw = base64.b64decode(b64)
            data = json.loads(raw)
            return credentials.Certificate(data)
        except Exception:
            pass
    path = Config.FIREBASE_SERVICE_ACCOUNT_PATH
    if path and os.path.exists(path):
        return credentials.Certificate(path)
    return None


def get_app():
    global _app
    if _app is None:
        with _lock:
            if _app is None:
                cred = get_credentials()
                opts = {"projectId": Config.FIREBASE_PROJECT_ID}
                if cred is None:
                    raise RuntimeError(
                        "Firebase Admin SDK credentials not found. "
                        f"Checked path: {Config.FIREBASE_SERVICE_ACCOUNT_PATH}. "
                        "Please download a service account key and set FIREBASE_SERVICE_ACCOUNT_PATH."
                    )
                _app = firebase_admin.initialize_app(cred, opts)
    return _app


def get_db():
    global _db
    if _db is None:
        with _lock:
            if _db is None:
                _db = firestore.client(app=get_app())
                _use_rest_transport(_db)
    return _db


def _use_rest_transport(db):
    """Route Firestore calls over HTTPS (REST) instead of gRPC.

    gRPC uploads/downloads are required transports, but many sandboxed or
    firewalled environments (and some proxies) block the HTTP/2 gRPC channel
    while plain HTTPS works fine. The REST transport is a first-class Google
    Cloud Firestore transport, so this keeps the app working everywhere.
    Falls back to the default gRPC client if REST cannot be constructed.
    """
    try:
        from google.cloud.firestore_v1.services.firestore.client import FirestoreClient
        cred = get_app().credential.get_credential()
        if hasattr(cred, "with_scopes_if_required"):
            try:
                cred = cred.with_scopes_if_required(
                    ["https://www.googleapis.com/auth/datastore"]
                )
            except Exception:
                pass
        gapic = FirestoreClient(credentials=cred, transport="rest")
        db._firestore_api_internal = gapic
    except Exception:
        pass


def verify_token(token: str) -> dict:
    app = get_app()
    return fb_auth.verify_id_token(token, app=app)
