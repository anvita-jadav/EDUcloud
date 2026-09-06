from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.jwtutils import require_role
from app.core.firestore_utils import (
    add_item, query_first, list_collection, gen_id, now, get_item,
    delete_item, delete_collection_docs,
)

router = APIRouter(dependencies=[Depends(require_role("admin"))])


# ---------- Students ----------
class StudentPayload(BaseModel):
    name: str
    email: str
    roll_number: str = ""
    department: str = ""
    semester: str = ""


@router.get("/students")
def list_students():
    faculties = {f["faculty_id"]: f for f in list_collection("faculties")}
    rows = list_collection("students")
    rows.sort(key=lambda s: s.get("name", "").lower())
    return {"students": [
        {"id": s.get("student_id"), "name": s.get("name"), "email": s.get("email"),
         "roll_number": s.get("roll_number", ""), "department": s.get("department", ""),
         "semester": s.get("semester", ""),
         "faculty_id": s.get("faculty_id", "") or "",
         "faculty": faculties.get(s.get("faculty_id"), {}).get("name", "") or "Not assigned"}
        for s in rows
    ]}


@router.post("/students")
def create_student(payload: StudentPayload):
    student_id = gen_id()
    add_item("students", {
        "student_id": student_id,
        "name": payload.name,
        "email": payload.email,
        "roll_number": payload.roll_number,
        "department": payload.department,
        "semester": payload.semester,
        "created_at": now(),
        "updated_at": now(),
    })
    return {"message": "Student created", "id": student_id}


@router.delete("/students/{student_id}")
def delete_student(student_id: str):
    doc = _doc_id_by_field("students", "student_id", student_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Student not found")
    delete_item("students", doc)
    delete_collection_docs("attendances", "student_id", student_id)
    delete_collection_docs("results", "student_id", student_id)
    return {"message": "Student deleted"}


# ---------- Faculty ----------
class FacultyPayload(BaseModel):
    name: str
    email: str = ""
    department: str = ""
    subject: str = ""
    username: str = ""
    password: str = ""


@router.get("/faculty")
def list_faculty():
    rows = list_collection("faculties")
    return {"faculty": [
        {"id": f.get("faculty_id"), "name": f.get("name"), "email": f.get("email"),
         "department": f.get("department", ""), "subject": f.get("subject", ""),
         "username": f.get("username", "")}
        for f in rows
    ]}


@router.post("/faculty")
def create_faculty(payload: FacultyPayload):
    username = (payload.username or "").strip()
    if not username:
        raise HTTPException(status_code=422, detail="Username is required")
    if len((payload.password or "")) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    if query_first("users", "username", "==", username):
        raise HTTPException(status_code=409, detail="Username is already taken")

    from app.core.cred_auth import hash_password
    faculty_id = gen_id()
    user_id = gen_id()
    add_item("faculties", {
        "faculty_id": faculty_id,
        "user_id": user_id,
        "username": username,
        "name": payload.name,
        "email": payload.email,
        "department": payload.department,
        "subject": payload.subject,
        "created_at": now(),
        "updated_at": now(),
    })
    add_item("users", {
        "uid": username,
        "user_id": user_id,
        "username": username,
        "email": payload.email,
        "name": payload.name,
        "role": "faculty",
        "auth_type": "credentials",
        "password_hash": hash_password(payload.password),
        "created_at": now(),
        "updated_at": now(),
    })
    return {"message": "Faculty created", "id": faculty_id}


@router.delete("/faculty/{faculty_id}")
def delete_faculty(faculty_id: str):
    doc = _doc_id_by_field("faculties", "faculty_id", faculty_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Faculty not found")
    faculty = get_item("faculties", doc)
    delete_item("faculties", doc)
    if faculty and faculty.get("user_id"):
        user_doc = query_first("users", "user_id", "==", faculty["user_id"])
        if user_doc:
            delete_item("users", user_doc["id"])
    delete_collection_docs("courses", "faculty_id", faculty_id)
    return {"message": "Faculty deleted"}


# ---------- Courses ----------
class CoursePayload(BaseModel):
    code: str
    name: str
    department: str = ""
    semester: str = ""
    credits: int = 0
    faculty_id: str = ""


@router.get("/courses")
def list_courses():
    rows = list_collection("courses")
    return {"courses": [
        {"id": c.get("course_id"), "code": c.get("code"), "name": c.get("name"),
         "department": c.get("department", ""), "semester": c.get("semester", ""),
         "credits": c.get("credits", 0), "faculty_id": c.get("faculty_id", "")}
        for c in rows
    ]}


@router.post("/courses")
def create_course(payload: CoursePayload):
    if payload.code and query_first("courses", "code", "==", payload.code):
        raise HTTPException(status_code=409, detail="A course with this code already exists")
    if payload.faculty_id and not query_first("faculties", "faculty_id", "==", payload.faculty_id):
        raise HTTPException(status_code=422, detail="Invalid faculty_id")
    course_id = gen_id()
    add_item("courses", {
        "course_id": course_id,
        "code": payload.code,
        "name": payload.name,
        "department": payload.department,
        "semester": payload.semester,
        "credits": payload.credits,
        "faculty_id": payload.faculty_id or None,
        "created_at": now(),
        "updated_at": now(),
    })
    return {"message": "Course created", "id": course_id}


@router.delete("/courses/{course_id}")
def delete_course(course_id: str):
    doc = _doc_id_by_field("courses", "course_id", course_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Course not found")
    delete_item("courses", doc)
    delete_collection_docs("attendances", "course_id", course_id)
    delete_collection_docs("results", "course_id", course_id)
    delete_collection_docs("timetable", "course_id", course_id)
    return {"message": "Course deleted"}


# ---------- Timetable ----------
class TimetablePayload(BaseModel):
    course_id: str
    day: str = ""
    time: str = ""
    room: str = ""


@router.get("/timetable")
def list_timetable():
    courses = {c["course_id"]: c for c in list_collection("courses")}
    rows = list_collection("timetable")
    return {"timetable": [
        {"id": t.get("timetable_id", t.get("id")), "course": courses.get(t.get("course_id"), {}).get("name", ""),
         "day": t.get("day"), "time": t.get("time"), "room": t.get("room")}
        for t in rows
    ]}


@router.post("/timetable")
def create_timetable_entry(payload: TimetablePayload):
    add_item("timetable", {
        "timetable_id": gen_id(),
        "course_id": payload.course_id,
        "day": payload.day,
        "time": payload.time,
        "room": payload.room,
        "created_at": now(),
    })
    return {"message": "Timetable entry added"}


@router.delete("/timetable/{entry_id}")
def delete_timetable_entry(entry_id: str):
    doc = _doc_id_by_field("timetable", "timetable_id", entry_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Entry not found")
    delete_item("timetable", doc)
    return {"message": "Entry deleted"}


# ---------- Reports ----------
@router.get("/reports")
def admin_reports():
    return {
        "reports": {
            "students": len(list_collection("students")),
            "faculty": len(list_collection("faculties")),
            "courses": len(list_collection("courses")),
            "attendance_records": len(list_collection("attendances")),
            "results_entries": len(list_collection("results")),
        }
    }


# ---------- Notifications ----------
class NotificationPayload(BaseModel):
    title: str
    message: str = ""
    role: str = "student"
    user_id: str = ""


@router.post("/notifications")
def send_notification(payload: NotificationPayload):
    add_item("notifications", {
        "notification_id": gen_id(),
        "title": payload.title,
        "message": payload.message,
        "role": payload.role,
        "user_id": payload.user_id or None,
        "created_at": now(),
    })
    return {"message": "Notification sent"}


@router.get("/notifications")
def all_notifications():
    rows = list_collection("notifications")
    rows.sort(key=lambda n: n.get("created_at", ""), reverse=True)
    return {"notifications": [
        {"id": n.get("id"), "title": n.get("title"), "message": n.get("message"),
         "role": n.get("role"), "date": n.get("created_at")}
        for n in rows
    ]}


def _doc_id_by_field(collection, field, value):
    doc = query_first(collection, field, "==", value)
    return doc.get("id") if doc else None