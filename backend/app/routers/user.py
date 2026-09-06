from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import Config
from app.core.jwtutils import parse_token, get_current_user
from app.core.firestore_utils import (
    add_item, query_first, list_collection, gen_id, now, UserRecord,
)
from app.core.cred_auth import (
    verify_password, validate_admin_credentials,
)
from app.core.session_token import create_session_token

router = APIRouter()


class RegisterPayload(BaseModel):
    name: str = ""
    roll_number: str = ""
    department: str = ""
    semester: str = ""
    faculty_id: str = ""


class CredLoginPayload(BaseModel):
    username: str
    password: str


def _public_user(user):
    return {
        "user_id": user.get("user_id"),
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        "role": user.get("role", "student"),
    }


@router.post("/register")
def register(
    payload: RegisterPayload,
    token_payload: dict = Depends(parse_token),
):
    firebase_uid = token_payload["uid"]
    email = token_payload.get("email", "")

    if not payload.name.strip():
        raise HTTPException(status_code=422, detail="Name is required")

    # Students self-register only; faculty are created by the admin.
    user_role = "student"

    # Validate assigned faculty exists.
    faculty = None
    if payload.faculty_id:
        faculty = query_first("faculties", "faculty_id", "==", payload.faculty_id)
        if not faculty:
            raise HTTPException(status_code=422, detail="Selected faculty does not exist")

    existing = query_first("users", "uid", "==", firebase_uid)
    if not existing and email:
        existing = query_first("users", "email", "==", email)
    if existing:
        existing["uid"] = firebase_uid
        existing["name"] = payload.name or existing.get("name", "")
        existing["role"] = user_role
        existing["updated_at"] = now()
        add_item("users", existing, doc_id=existing["id"])

        profile = query_first("profiles", "user_id", "==", existing["user_id"])
        profile_data = profile or {
            "profile_id": gen_id(),
            "user_id": existing["user_id"],
            "roll_number": "",
            "department": "",
            "semester": "",
        }
        profile_data["roll_number"] = payload.roll_number
        profile_data["department"] = payload.department
        profile_data["semester"] = payload.semester
        add_item("profiles", profile_data, doc_id=profile_data["profile_id"])

        student = get_student_profile(existing["user_id"])
        if not student:
            add_item("students", {
                "student_id": gen_id(),
                "user_id": existing["user_id"],
                "uid": firebase_uid,
                "name": payload.name,
                "email": email,
                "roll_number": payload.roll_number,
                "department": payload.department,
                "semester": payload.semester,
                "faculty_id": payload.faculty_id or None,
                "created_at": now(),
                "updated_at": now(),
            })
        elif payload.faculty_id:
            student["faculty_id"] = payload.faculty_id
            student["updated_at"] = now()
            add_item("students", student, doc_id=student["id"])
        return {"message": "User updated", "user_id": existing["user_id"], "role": existing["role"]}

    user_id = gen_id()
    add_item("users", {
        "uid": firebase_uid,
        "user_id": user_id,
        "email": email,
        "name": payload.name,
        "role": user_role,
        "auth_type": "firebase",
        "created_at": now(),
        "updated_at": now(),
    })

    add_item("profiles", {
        "profile_id": gen_id(),
        "user_id": user_id,
        "roll_number": payload.roll_number,
        "department": payload.department,
        "semester": payload.semester,
    })

    add_item("students", {
        "student_id": gen_id(),
        "user_id": user_id,
        "uid": firebase_uid,
        "name": payload.name,
        "email": email,
        "roll_number": payload.roll_number,
        "department": payload.department,
        "semester": payload.semester,
        "faculty_id": payload.faculty_id or None,
        "created_at": now(),
        "updated_at": now(),
    })

    return {
        "message": "User created successfully",
        "user_id": user_id,
        "email": email,
        "role": user_role,
    }


@router.get("/faculty-list")
def faculty_list():
    """Available faculty for students to choose an advisor during signup."""
    rows = list_collection("faculties")
    return {"faculties": [
        {"id": f.get("faculty_id"), "name": f.get("name"), "department": f.get("department", ""),
         "subject": f.get("subject", "")}
        for f in rows
    ]}


@router.post("/credential-login")
def credential_login(payload: CredLoginPayload):
    """Login for faculty accounts created by the admin."""
    username = (payload.username or "").strip()
    if not username or not payload.password:
        raise HTTPException(status_code=422, detail="Username and password are required")

    user = query_first("users", "username", "==", username)
    if not user or user.get("role") != "faculty":
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_session_token({
        "uid": user["uid"],
        "role": "faculty",
        "name": user.get("name", ""),
        "email": user.get("email", ""),
    })
    return {"token": token, "user": _public_user(user)}


@router.post("/admin-login")
def admin_login(payload: CredLoginPayload):
    """Fixed admin login (username: jadav, password: EDUcloud@987)."""
    if not validate_admin_credentials(payload.username, payload.password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    # Ensure the admin users document exists so /me and role checks work.
    admin = query_first("users", "uid", "==", Config.ADMIN_USERNAME)
    if not admin:
        user_id = gen_id()
        add_item("users", {
            "uid": Config.ADMIN_USERNAME,
            "user_id": user_id,
            "username": Config.ADMIN_USERNAME,
            "email": "",
            "name": Config.ADMIN_USERNAME,
            "role": "admin",
            "auth_type": "credentials",
            "created_at": now(),
            "updated_at": now(),
        })
        admin = {
            "user_id": user_id,
            "email": "",
            "name": Config.ADMIN_USERNAME,
            "role": "admin",
        }
    else:
        admin["name"] = Config.ADMIN_USERNAME
        admin["role"] = "admin"
        admin["updated_at"] = now()
        add_item("users", admin, doc_id=admin["id"])

    token = create_session_token({
        "uid": Config.ADMIN_USERNAME,
        "role": "admin",
        "name": Config.ADMIN_USERNAME,
    })
    return {"token": token, "user": _public_user(admin)}


@router.post("/oauth/register")
def oauth_register(
    token_payload: dict = Depends(parse_token),
):
    firebase_uid = token_payload["uid"]
    email = token_payload.get("email", "")
    name = token_payload.get("name", "")

    existing = query_first("users", "uid", "==", firebase_uid)
    if not existing and email:
        existing = query_first("users", "email", "==", email)
    if existing:
        return {"message": "User already registered", "user_id": existing["user_id"], "role": existing["role"]}

    user_id = gen_id()
    add_item("users", {
        "uid": firebase_uid,
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": "student",
        "auth_type": "firebase",
        "created_at": now(),
        "updated_at": now(),
    })

    add_item("profiles", {
        "profile_id": gen_id(),
        "user_id": user_id,
        "roll_number": "",
        "department": "",
        "semester": "",
    })

    add_item("students", {
        "student_id": gen_id(),
        "user_id": user_id,
        "uid": firebase_uid,
        "name": name,
        "email": email,
        "roll_number": "",
        "department": "",
        "semester": "",
        "faculty_id": None,
        "created_at": now(),
        "updated_at": now(),
    })

    return {
        "message": "OAuth user created",
        "user_id": user_id,
        "email": email,
        "role": "student",
    }


@router.get("/me")
def me(current_user: UserRecord = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "created_at": getattr(current_user, "created_at", None),
    }


@router.get("/me/profile")
def my_profile(current_user: UserRecord = Depends(get_current_user)):
    profile = query_first("profiles", "user_id", "==", current_user.user_id)
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "profile": {
            "roll_number": profile.get("roll_number", "") if profile else "",
            "department": profile.get("department", "") if profile else "",
            "semester": profile.get("semester", "") if profile else "",
            "faculty_id": getattr(current_user, "faculty_id", "") or "",
        },
    }


def get_student_profile(user_id):
    return query_first("students", "user_id", "==", user_id)