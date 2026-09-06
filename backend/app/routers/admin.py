from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.jwtutils import get_current_user, require_role
from app.core.dbutils import get_db
from app.models.models import User, Faculty, Student, Course, Result, Notification, Timetable, Attendance

router = APIRouter(dependencies=[Depends(require_role("admin"))])


# ---------- Students ----------
class StudentPayload(BaseModel):
    name: str
    email: str
    roll_number: str = ""
    department: str = ""
    semester: str = ""


@router.get("/students")
def list_students(db: Session = Depends(get_db)):
    rows = db.query(Student).all()
    return {"students": [
        {"id": s.student_id, "name": s.name, "email": s.email,
         "roll_number": s.roll_number, "department": s.department, "semester": s.semester}
        for s in rows
    ]}


@router.post("/students")
def create_student(payload: StudentPayload, db: Session = Depends(get_db)):
    student = Student(
        name=payload.name,
        email=payload.email,
        roll_number=payload.roll_number,
        department=payload.department,
        semester=payload.semester,
    )
    db.add(student)
    db.commit()
    return {"message": "Student created", "id": student.student_id}


@router.delete("/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return {"message": "Student deleted"}


# ---------- Faculty ----------
class FacultyPayload(BaseModel):
    name: str
    email: str
    department: str = ""
    subject: str = ""


@router.get("/faculty")
def list_faculty(db: Session = Depends(get_db)):
    rows = db.query(Faculty).all()
    return {"faculty": [
        {"id": f.faculty_id, "name": f.name, "email": f.email,
         "department": f.department, "subject": f.subject}
        for f in rows
    ]}


@router.post("/faculty")
def create_faculty(payload: FacultyPayload, db: Session = Depends(get_db)):
    faculty = Faculty(
        name=payload.name,
        email=payload.email,
        department=payload.department,
        subject=payload.subject,
    )
    db.add(faculty)
    db.commit()
    return {"message": "Faculty created", "id": faculty.faculty_id}


@router.delete("/faculty/{faculty_id}")
def delete_faculty(faculty_id: str, db: Session = Depends(get_db)):
    faculty = db.query(Faculty).filter(Faculty.faculty_id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    db.delete(faculty)
    db.commit()
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
def list_courses(db: Session = Depends(get_db)):
    rows = db.query(Course).all()
    return {"courses": [
        {"id": c.course_id, "code": c.code, "name": c.name,
         "department": c.department, "semester": c.semester, "credits": c.credits,
         "faculty_id": c.faculty_id}
        for c in rows
    ]}


@router.post("/courses")
def create_course(payload: CoursePayload, db: Session = Depends(get_db)):
    course = Course(
        code=payload.code,
        name=payload.name,
        department=payload.department,
        semester=payload.semester,
        credits=payload.credits,
        faculty_id=payload.faculty_id or None,
    )
    db.add(course)
    db.commit()
    return {"message": "Course created", "id": course.course_id}


@router.delete("/courses/{course_id}")
def delete_course(course_id: str, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}


# ---------- Timetable ----------
class TimetablePayload(BaseModel):
    course_id: str
    day: str = ""
    time: str = ""
    room: str = ""


@router.get("/timetable")
def list_timetable(db: Session = Depends(get_db)):
    rows = db.query(Timetable).join(Course).all()
    return {"timetable": [
        {"id": t.timetable_id, "course": t.course.name if t.course else "",
         "day": t.day, "time": t.time, "room": t.room}
        for t in rows
    ]}


@router.post("/timetable")
def create_timetable_entry(payload: TimetablePayload, db: Session = Depends(get_db)):
    entry = Timetable(
        course_id=payload.course_id,
        day=payload.day,
        time=payload.time,
        room=payload.room,
    )
    db.add(entry)
    db.commit()
    return {"message": "Timetable entry added"}


@router.delete("/timetable/{entry_id}")
def delete_timetable_entry(entry_id: str, db: Session = Depends(get_db)):
    entry = db.query(Timetable).filter(Timetable.timetable_id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted"}


# ---------- Reports ----------
@router.get("/reports")
def admin_reports(db: Session = Depends(get_db)):
    students = db.query(Student).count()
    faculty = db.query(Faculty).count()
    courses = db.query(Course).count()
    attendance = db.query(Attendance).count()
    results = db.query(Result).count()
    return {
        "reports": {
            "students": students,
            "faculty": faculty,
            "courses": courses,
            "attendance_records": attendance,
            "results_entries": results,
        }
    }


# ---------- Notifications ----------
class NotificationPayload(BaseModel):
    title: str
    message: str = ""
    role: str = "student"
    user_id: str = ""


@router.post("/notifications")
def send_notification(
    payload: NotificationPayload,
    db: Session = Depends(get_db),
):
    db.add(Notification(
        title=payload.title,
        message=payload.message,
        role=payload.role,
        user_id=payload.user_id or None,
    ))
    db.commit()
    return {"message": "Notification sent"}


@router.get("/notifications")
def all_notifications(db: Session = Depends(get_db)):
    rows = db.query(Notification).order_by(Notification.created_at.desc()).all()
    return {"notifications": [
        {"id": n.notification_id, "title": n.title, "message": n.message,
         "role": n.role, "date": n.created_at}
        for n in rows
    ]}
