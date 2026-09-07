import os
import base64
import json
import secrets
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


class Config:
    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
    FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json"
    )
    # Populate this with the base64-encoded service account JSON on Render so the
    # credential can be provided without committing the key file.
    FIREBASE_SERVICE_ACCOUNT_B64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_B64", "")
    CORS_ORIGINS = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
        if o.strip()
    ]
    # Any https origin hosted on Render is treated as a trusted frontend, so
    # the app keeps working even when the frontend URL changes (random Render
    # suffix) without needing a backend env-var edit.
    CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX", r"https://[a-z0-9-]+\.onrender\.com")
    # Used to sign attendance QR tokens and credential-login sessions.
    # Set a stable value in production.
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)

    # Fixed admin account (login username: jadav / password: EDUcloud@987)
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "jadav")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "EDUcloud@987")

    # Gemini API key used by the EDUtech AI chatbot
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def validate_config():
    if not Config.FIREBASE_PROJECT_ID:
        raise RuntimeError(
            "FIREBASE_PROJECT_ID is not set. Add it to backend/.env (see .env.sample)."
        )
    if Config.FIREBASE_SERVICE_ACCOUNT_B64:
        try:
            json.loads(base64.b64decode(Config.FIREBASE_SERVICE_ACCOUNT_B64))
        except Exception as exc:
            raise RuntimeError(
                "FIREBASE_SERVICE_ACCOUNT_B64 is not valid base64-encoded JSON "
                f"(decode failed: {exc})."
            )
        return
    path = Config.FIREBASE_SERVICE_ACCOUNT_PATH
    if path and not os.path.exists(path):
        raise RuntimeError(
            f"Firebase service account file not found at: {path}. "
            "Download it from Firebase console and update FIREBASE_SERVICE_ACCOUNT_PATH."
        )