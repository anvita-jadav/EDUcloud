from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.jwtutils import get_current_user, require_role
from app.core.dbutils import get_db
from app.models.models import User, Faculty, Student, Course, Attendance, Notification, Result

router = APIRouter(dependencies=[Depends(require_role("faculty", "admin"))])


@router.get("/dashboard")
def faculty_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.user_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    courses = db.query(Course).filter(Course.faculty_id == faculty.faculty_id).all()
    course_ids = [c.course_id for c in courses]
    attendance = (
        db.query(Attendance).filter(Attendance.course_id.in_(course_ids)).all()
        if course_ids else []
    )
    total_attendance = len(attendance)
    present = sum(1 for a in attendance if a.status == "present")

    students = db.query(Student).count()

    return {
        "name": current_user.name,
        "department": faculty.department,
        "subject": faculty.subject,
        "courses": [{"id": c.course_id, "code": c.code, "name": c.name, "semester": c.semester} for c in courses],
        "attendance_marked": total_attendance,
        "attendance_percentage": round((present / total_attendance) * 100, 2) if total_attendance else 0,
        "students_total": students,
    }


class MarkAttendancePayload(BaseModel):
    course_id: str
    date: str = ""
    student_ids: list = []


@router.post("/attendance/mark")
def mark_attendance(
    payload: MarkAttendancePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import date
    att_date = payload.date or str(date.today())
    count = 0
    for sid in payload.student_ids:
        exists = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == sid,
                Attendance.course_id == payload.course_id,
                Attendance.date == att_date,
            )
            .first()
        )
        if not exists:
            db.add(Attendance(
                student_id=sid,
                course_id=payload.course_id,
                date=att_date,
                status="present",
                method="manual",
            ))
            count += 1
    db.commit()
    return {"message": f"Marked {count} students present", "date": att_date}


@router.get("/students")
def list_students(db: Session = Depends(get_db)):
    rows = db.query(Student).all()
    return {"students": [
        {"id": s.student_id, "name": s.name, "email": s.email,
         "roll_number": s.roll_number, "department": s.department, "semester": s.semester}
        for s in rows
    ]}


class MarkResultPayload(BaseModel):
    course_id: str
    student_id: str
    internal_marks: float = 0
    external_marks: float = 0
    grade: str = ""


@router.post("/results/enter")
def enter_result(
    payload: MarkResultPayload,
    db: Session = Depends(get_db),
):
    result = (
        db.query(Result)
        .filter(Result.course_id == payload.course_id, Result.student_id == payload.student_id)
        .first()
    )
    if result:
        result.internal_marks = payload.internal_marks
        result.external_marks = payload.external_marks
        result.grade = payload.grade
    else:
        db.add(Result(
            course_id=payload.course_id,
            student_id=payload.student_id,
            internal_marks=payload.internal_marks,
            external_marks=payload.external_marks,
            grade=payload.grade,
        ))
    db.commit()
    return {"message": "Result saved"}


@router.get("/reports")
def faculty_reports(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    report = []
    for c in courses:
        att = db.query(Attendance).filter(Attendance.course_id == c.course_id).all()
        total = len(att)
        present = sum(1 for a in att if a.status == "present")
        report.append({
            "course": c.name,
            "code": c.code,
            "total_marks_entries": total,
            "attendance_pct": round((present / total) * 100, 2) if total else 0,
        })
    return {"reports": report}
