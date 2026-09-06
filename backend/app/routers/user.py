from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.jwtutils import parse_supabase_jwt, get_current_user
from app.core.dbutils import get_db
from app.models.models import User, Profile, Student, Faculty

router = APIRouter()


class RegisterPayload(BaseModel):
    name: str = ""
    role: str = "student"
    roll_number: str = ""
    department: str = ""
    semester: str = ""
    subject: str = ""


@router.post("/register")
def register(
    payload: RegisterPayload,
    token_payload: dict = Depends(parse_supabase_jwt),
    db: Session = Depends(get_db),
):
    supabase_uid = token_payload["sub"]
    email = token_payload.get("email", "")

    user_role = payload.role
    if user_role not in ("student", "faculty", "admin"):
        user_role = "student"

    existing = db.query(User).filter(User.supabase_uid == supabase_uid).first()
    if existing:
        existing.name = payload.name
        existing.role = user_role
        db.commit()
        db.refresh(existing)

        profile = db.query(Profile).filter(Profile.user_id == existing.user_id).first()
        if not profile:
            profile = Profile(user_id=existing.user_id)
            db.add(profile)
        profile.roll_number = payload.roll_number
        profile.department = payload.department
        profile.semester = payload.semester
        db.commit()
        return {"message": "User updated", "user_id": existing.user_id, "role": existing.role}

    new_user = User(
        supabase_uid=supabase_uid,
        email=email,
        name=payload.name,
        role=user_role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    profile = Profile(
        user_id=new_user.user_id,
        roll_number=payload.roll_number,
        department=payload.department,
        semester=payload.semester,
    )
    db.add(profile)

    if user_role == "student":
        db.add(Student(
            user_id=new_user.user_id,
            name=payload.name,
            email=email,
            roll_number=payload.roll_number,
            department=payload.department,
            semester=payload.semester,
        ))
    elif user_role == "faculty":
        db.add(Faculty(
            user_id=new_user.user_id,
            name=payload.name,
            email=email,
            department=payload.department,
            subject=payload.subject,
        ))

    db.commit()
    return {
        "message": "User created successfully",
        "user_id": new_user.user_id,
        "email": new_user.email,
        "role": new_user.role,
    }


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "created_at": current_user.created_at,
    }


@router.get("/me/profile")
def my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.user_id).first()
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "profile": {
            "roll_number": profile.roll_number if profile else "",
            "department": profile.department if profile else "",
            "semester": profile.semester if profile else "",
        },
    }
