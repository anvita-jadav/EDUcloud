from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import date, datetime, timezone

from app.core.jwtutils import get_current_user, require_role
from app.core.firestore_utils import (
    add_item, query_first, query_items, query_in, list_collection, gen_id, now, UserRecord,
)
from app.core.qr_token import generate_qr_token

router = APIRouter(dependencies=[Depends(require_role("faculty", "admin"))])


@router.get("/attendance/qr/{course_id}")
def qr_token(course_id: str, current_user: UserRecord = Depends(get_current_user)):
    course = query_first("courses", "course_id", "==", course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    start = int(datetime.now().timestamp())
    duration = 60 * 60
    return {
        "token": generate_qr_token(course["code"], start, duration),
        "course_id": course_id,
        "code": course["code"],
        "name": course.get("name", ""),
        "starts_at_ts": start,
        "ends_at_ts": start + duration,
    }


class QRPayload(BaseModel):
    course_id: str
    starts_at: str = ""          # ISO datetime; defaults to now
    duration_minutes: int = 60


@router.post("/attendance/qr")
def create_qr(payload: QRPayload, current_user: UserRecord = Depends(get_current_user)):
    """Generates a QR valid only during the faculty-defined class window."""
    course = query_first("courses", "course_id", "==", payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not (5 <= payload.duration_minutes <= 300):
        raise HTTPException(status_code=422, detail="Duration must be between 5 and 300 minutes")

    start = int(datetime.now().timestamp())
    if payload.starts_at.strip():
        try:
            parsed = datetime.fromisoformat(payload.starts_at.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                # Frontend always sends UTC (trailing Z). Naive strings fall
                # back to UTC so a QR generated "now" is usable immediately
                # regardless of the server's timezone.
                parsed = parsed.replace(tzinfo=timezone.utc)
            start = int(parsed.timestamp())
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid start time format")

    duration = int(payload.duration_minutes * 60)
    if start + duration < int(datetime.now().timestamp()):
        raise HTTPException(status_code=422, detail="This class time has already ended")

    return {
        "token": generate_qr_token(course["code"], start, duration),
        "course_id": course["course_id"],
        "code": course["code"],
        "name": course.get("name", ""),
        "starts_at_ts": start,
        "ends_at_ts": start + duration,
    }


def _faculty_by_uid(uid):
    return query_first("faculties", "user_id", "==", uid)


@router.get("/dashboard")
def faculty_dashboard(current_user: UserRecord = Depends(get_current_user)):
    faculty = _faculty_by_uid(current_user.user_id)
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    courses = query_items("courses", "faculty_id", "==", faculty["faculty_id"])
    course_ids = [c["course_id"] for c in courses]
    attendance = query_in("attendances", "course_id", course_ids)
    total_attendance = len(attendance)
    present = sum(1 for a in attendance if a.get("status") == "present")

    students = query_items("students", "faculty_id", "==", faculty["faculty_id"])

    return {
        "name": current_user.name,
        "department": faculty.get("department", ""),
        "subject": faculty.get("subject", ""),
        "courses": [
            {"id": c.get("course_id"), "code": c.get("code"), "name": c.get("name"),
             "semester": c.get("semester")}
            for c in courses
        ],
        "attendance_marked": total_attendance,
        "attendance_percentage": round((present / total_attendance) * 100, 2) if total_attendance else 0,
        "students_total": len(students),
    }


class MarkAttendancePayload(BaseModel):
    course_id: str
    date: str = ""
    student_ids: list = []


@router.post("/attendance/mark")
def mark_attendance(payload: MarkAttendancePayload, current_user: UserRecord = Depends(get_current_user)):
    from datetime import date
    att_date = payload.date or str(date.today())
    try:
        datetime.fromisoformat(att_date)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date format")
    if att_date > str(date.today()):
        raise HTTPException(status_code=422, detail="Cannot mark attendance for a future date")
    count = 0
    for sid in payload.student_ids:
        existing = [
            a for a in query_items("attendances", "student_id", "==", sid)
            if a.get("course_id") == payload.course_id and a.get("date") == att_date
        ]
        if existing:
            continue
        add_item("attendances", {
            "attendance_id": gen_id(),
            "student_id": sid,
            "course_id": payload.course_id,
            "date": att_date,
            "status": "present",
            "method": "manual",
            "marked_by": current_user.user_id,
            "created_at": now(),
        })
        count += 1
    return {"message": f"Marked {count} students present", "date": att_date}


@router.get("/attendance/qr-present/{course_id}")
def qr_attendance(course_id: str, date: str = "", current_user: UserRecord = Depends(get_current_user)):
    """Students who scanned the teacher's QR for a course (optionally a date).
    Returns their full profile plus the class window and their check-in time."""
    course = query_first("courses", "course_id", "==", course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    students = {
        s.get("student_id"): s for s in list_collection("students")
    }
    rows = query_items("attendances", "course_id", "==", course_id)
    if date:
        rows = [a for a in rows if a.get("date") == date]

    present = []
    for a in rows:
        if a.get("status") != "present":
            continue
        st = students.get(a.get("student_id")) or {}
        present.append({
            "student_id": st.get("student_id"),
            "name": st.get("name", ""),
            "email": st.get("email", ""),
            "roll_number": st.get("roll_number", ""),
            "department": st.get("department", ""),
            "semester": st.get("semester", ""),
            "date": a.get("date"),
            "method": a.get("method", ""),
            "session_start": a.get("session_start"),
            "session_end": a.get("session_end"),
            "session_duration": a.get("session_duration"),
            "checked_in_at": a.get("checked_in_at"),
        })
    present.sort(key=lambda p: p.get("checked_in_at") or "", reverse=True)

    return {
        "course": {"id": course.get("course_id"), "code": course.get("code"),
                   "name": course.get("name", "")},
        "total_present": len(present),
        "students": present,
    }


@router.get("/students")
def list_students(current_user: UserRecord = Depends(get_current_user)):
    faculty = _faculty_by_uid(current_user.user_id)
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    rows = query_items("students", "faculty_id", "==", faculty["faculty_id"])
    return {"students": [
        {"id": s.get("student_id"), "name": s.get("name"), "email": s.get("email"),
         "roll_number": s.get("roll_number", ""), "department": s.get("department", ""),
         "semester": s.get("semester", "")}
        for s in rows
    ]}


class MarkResultPayload(BaseModel):
    course_id: str
    student_id: str
    internal_marks: float = 0
    external_marks: float = 0
    grade: str = ""


@router.post("/results/enter")
def enter_result(payload: MarkResultPayload, current_user: UserRecord = Depends(get_current_user)):
    if not (0 <= payload.internal_marks <= 50):
        raise HTTPException(status_code=422, detail="Internal marks must be between 0 and 50")
    if not (0 <= payload.external_marks <= 50):
        raise HTTPException(status_code=422, detail="External marks must be between 0 and 50")
    existing = None
    for r in query_items("results", "student_id", "==", payload.student_id):
        if r.get("course_id") == payload.course_id:
            existing = r
            break
    data = {
        "internal_marks": payload.internal_marks,
        "external_marks": payload.external_marks,
        "grade": payload.grade,
        "updated_by": current_user.user_id,
        "updated_at": now(),
    }
    if existing:
        existing.update(data)
        add_item("results", existing, doc_id=existing["id"])
    else:
        data.update({
            "result_id": gen_id(),
            "course_id": payload.course_id,
            "student_id": payload.student_id,
            "created_at": now(),
        })
        add_item("results", data)
    return {"message": "Result saved"}


@router.get("/reports")
def faculty_reports():
    courses = list_collection("courses")
    report = []
    for c in courses:
        att = query_items("attendances", "course_id", "==", c["course_id"])
        total = len(att)
        present = sum(1 for a in att if a.get("status") == "present")
        report.append({
            "course": c.get("name"),
            "code": c.get("code"),
            "total_marks_entries": len(query_items("results", "course_id", "==", c["course_id"])),
            "attendance_pct": round((present / total) * 100, 2) if total else 0,
        })
    return {"reports": report}