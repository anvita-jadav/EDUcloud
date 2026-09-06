from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from app.core.jwtutils import get_current_user, require_role
from app.core.dbutils import get_db
from app.models.models import (
    User, Attendance, Course, Result, Student, Notification, Timetable,
)

router = APIRouter(dependencies=[Depends(require_role("student"))])


@router.get("/dashboard")
def student_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == current_user.user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    attendances = db.query(Attendance).filter(Attendance.student_id == student.student_id).all()
    total = len(attendances)
    present = sum(1 for a in attendances if a.status == "present")
    attendance_pct = round((present / total) * 100, 2) if total else 0

    results = db.query(Result).filter(Result.student_id == student.student_id).all()
    internal_total = sum(r.internal_marks for r in results)
    external_total = sum(r.external_marks for r in results)
    avg_internal = round(internal_total / len(results), 2) if results else 0
    avg_external = round(external_total / len(results), 2) if results else 0

    notifications = (
        db.query(Notification)
        .filter(or_(Notification.user_id == current_user.user_id, Notification.user_id.is_(None)))
        .order_by(Notification.created_at.desc())
        .limit(10)
        .all()
    )

    timetable = []
    for t in db.query(Timetable).join(Course).all():
        timetable.append({
            "course": t.course.name if t.course else "",
            "day": t.day,
            "time": t.time,
            "room": t.room,
        })

    return {
        "name": current_user.name,
        "roll_number": student.roll_number,
        "department": student.department,
        "semester": student.semester,
        "attendance": {"total": total, "present": present, "percentage": attendance_pct},
        "results": {
            "subjects": len(results),
            "avg_internal": avg_internal,
            "avg_external": avg_external,
        },
        "notifications": [
            {"title": n.title, "message": n.message, "date": n.created_at} for n in notifications
        ],
        "timetable": timetable,
    }


@router.get("/attendance")
def student_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == current_user.user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    rows = db.query(Attendance).filter(Attendance.student_id == student.student_id).all()
    records = []
    for a in rows:
        course = db.query(Course).filter(Course.course_id == a.course_id).first()
        records.append({
            "date": a.date,
            "status": a.status,
            "method": a.method,
            "course": course.name if course else "",
        })

    total = len(records)
    present = sum(1 for r in records if r["status"] == "present")
    return {
        "percentage": round((present / total) * 100, 2) if total else 0,
        "records": records,
    }


@router.post("/attendance/checkin")
def qr_checkin(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == current_user.user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    course_code = (payload.get("course_code") or "").strip()
    course = db.query(Course).filter(Course.code == course_code).first()
    if not course:
        raise HTTPException(status_code=404, detail="Invalid course code / QR")

    from datetime import date
    today = str(date.today())
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student.student_id,
            Attendance.course_id == course.course_id,
            Attendance.date == today,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already marked present today for this course")

    att = Attendance(
        student_id=student.student_id,
        course_id=course.course_id,
        date=today,
        status="present",
        method="qr",
    )
    db.add(att)
    db.commit()
    return {"message": f"Attendance marked for {course.name}", "status": "present"}


@router.get("/results")
def student_results(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == current_user.user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    rows = db.query(Result).filter(Result.student_id == student.student_id).all()
    results = []
    for r in rows:
        course = db.query(Course).filter(Course.course_id == r.course_id).first()
        results.append({
            "course": course.name if course else "",
            "code": course.code if course else "",
            "internal_marks": r.internal_marks,
            "external_marks": r.external_marks,
            "grade": r.grade,
        })
    return {"results": results}


@router.get("/notifications")
def student_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Notification)
        .filter(or_(Notification.user_id == current_user.user_id, Notification.user_id.is_(None)))
        .order_by(Notification.created_at.desc())
        .all()
    )
    return {"notifications": [
        {"id": n.notification_id, "title": n.title, "message": n.message, "date": n.created_at}
        for n in rows
    ]}
