from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.jwtutils import get_current_user, require_role
from app.core.firestore_utils import (
    add_item, query_first, query_items, list_collection, gen_id, now, UserRecord,
)
from app.core.firestore_utils import get_student_by_uid
from app.core.qr_token import verify_qr_token

router = APIRouter(dependencies=[Depends(require_role("student"))])


def _course_map():
    return {c["course_id"]: c for c in list_collection("courses")}


@router.get("/dashboard")
def student_dashboard(current_user: UserRecord = Depends(get_current_user)):
    student = get_student_by_uid(current_user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    attendances = query_items("attendances", "student_id", "==", student["student_id"])
    total = len(attendances)
    present = sum(1 for a in attendances if a.get("status") == "present")
    attendance_pct = round((present / total) * 100, 2) if total else 0

    results = query_items("results", "student_id", "==", student["student_id"])
    avg_internal = round(sum(r.get("internal_marks", 0) for r in results) / len(results), 2) if results else 0
    avg_external = round(sum(r.get("external_marks", 0) for r in results) / len(results), 2) if results else 0

    notifications = [
        n for n in list_collection("notifications")
        if n.get("user_id") == current_user.user_id or not n.get("user_id")
        or n.get("user_id") == getattr(current_user, "uid", None)
    ]
    notifications.sort(key=lambda n: n.get("created_at", ""), reverse=True)
    notifications = notifications[:10]

    course_map = _course_map()
    timetable = [
        {"course": course_map.get(t.get("course_id"), {}).get("name", ""),
         "day": t.get("day"), "time": t.get("time"), "room": t.get("room")}
        for t in list_collection("timetable")
    ]

    mentor = ""
    if student.get("faculty_id"):
        f = query_first("faculties", "faculty_id", "==", student["faculty_id"])
        mentor = f.get("name", "") if f else ""

    return {
        "name": current_user.name,
        "roll_number": student.get("roll_number", ""),
        "department": student.get("department", ""),
        "semester": student.get("semester", ""),
        "mentor": mentor,
        "attendance": {"total": total, "present": present, "percentage": attendance_pct},
        "results": {"subjects": len(results), "avg_internal": avg_internal, "avg_external": avg_external},
        "notifications": [
            {"title": n.get("title"), "message": n.get("message"), "date": n.get("created_at")}
            for n in notifications
        ],
        "timetable": timetable,
    }


@router.get("/attendance")
def student_attendance(current_user: UserRecord = Depends(get_current_user)):
    student = get_student_by_uid(current_user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    course_map = _course_map()
    rows = query_items("attendances", "student_id", "==", student["student_id"])
    records = [
        {"date": a.get("date"), "status": a.get("status"), "method": a.get("method"),
         "course": course_map.get(a.get("course_id"), {}).get("name", "")}
        for a in rows
    ]
    total = len(records)
    present = sum(1 for r in records if r["status"] == "present")
    return {"percentage": round((present / total) * 100, 2) if total else 0, "records": records}


class MentorPayload(BaseModel):
    faculty_id: str


@router.post("/mentor")
def assign_mentor(payload: MentorPayload, current_user: UserRecord = Depends(get_current_user)):
    """Lets a signed-in student pick their teacher from the admin-added list."""
    student = get_student_by_uid(current_user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    faculty_id = (payload.faculty_id or "").strip()
    faculty = query_first("faculties", "faculty_id", "==", faculty_id)
    if not faculty:
        raise HTTPException(status_code=422, detail="Selected teacher does not exist")

    student["faculty_id"] = faculty_id
    student["updated_at"] = now()
    add_item("students", student, doc_id=student["id"])
    return {"message": f"Teacher set to {faculty.get('name', '')}", "mentor": faculty.get("name", "")}


class CheckinPayload(BaseModel):
    course_code: str = ""


@router.post("/attendance/checkin")
def qr_checkin(payload: CheckinPayload, current_user: UserRecord = Depends(get_current_user)):
    student = get_student_by_uid(current_user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    course_code = (payload.course_code or "").strip()
    if not course_code:
        raise HTTPException(status_code=422, detail="Course code is required")

    # A valid signed QR embeds the course code and the class window; the
    # student is only marked present while the class is running.
    from datetime import datetime as _dt
    session = verify_qr_token(course_code)
    if session is not None:
        if session.get("expired"):
            if session.get("starts_at", 0) > int(_dt.now().timestamp()):
                raise HTTPException(
                    status_code=400,
                    detail="This class hasn't started yet — scan it when the class begins",
                )
            raise HTTPException(
                status_code=400,
                detail="This class session has ended — ask your faculty for a fresh QR",
            )
        course_code = session["course_code"]
    elif course_code == "manual":
        raise HTTPException(status_code=422, detail="Invalid QR code")
    course = query_first("courses", "code", "==", course_code)
    if not course:
        raise HTTPException(status_code=404, detail="Invalid course code / QR")

    from datetime import date
    today = str(date.today())
    mine = query_items("attendances", "student_id", "==", student["student_id"])
    existing = next(
        (a for a in mine if a.get("course_id") == course["course_id"] and a.get("date") == today),
        None,
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Already marked present for {course.get('name')} today",
        )

    add_item("attendances", {
        "attendance_id": gen_id(),
        "student_id": student["student_id"],
        "course_id": course["course_id"],
        "date": today,
        "status": "present",
        "method": "qr",
        "session_start": session.get("starts_at") if session else None,
        "checked_in_at": now(),
        "created_at": now(),
    })
    return {
        "message": f"Present for {course.get('name')}",
        "status": "present",
        "course": course.get("name"),
        "starts_at": session.get("starts_at") if session else None,
    }


@router.get("/results")
def student_results(current_user: UserRecord = Depends(get_current_user)):
    student = get_student_by_uid(current_user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    course_map = _course_map()
    rows = query_items("results", "student_id", "==", student["student_id"])
    results = [
        {"course": course_map.get(r.get("course_id"), {}).get("name", ""),
         "code": course_map.get(r.get("course_id"), {}).get("code", ""),
         "internal_marks": r.get("internal_marks", 0),
         "external_marks": r.get("external_marks", 0),
         "grade": r.get("grade", "")}
        for r in rows
    ]
    return {"results": results}


@router.get("/notifications")
def student_notifications(current_user: UserRecord = Depends(get_current_user)):
    notifications = [
        n for n in list_collection("notifications")
        if n.get("user_id") == current_user.user_id or not n.get("user_id")
        or n.get("user_id") == getattr(current_user, "uid", None)
    ]
    notifications.sort(key=lambda n: n.get("created_at", ""), reverse=True)
    return {"notifications": [
        {"id": n.get("id"), "title": n.get("title"), "message": n.get("message"),
         "date": n.get("created_at")}
        for n in notifications
    ]}