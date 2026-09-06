from app.core.dbutils import Base, engine, SessionLocal
from app.models import models
from app.models.models import (
    User, Student, Faculty, Course, Attendance, Result, Timetable, Notification, Profile,
)

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if db.query(Course).count() == 0:
    faculty = Faculty(
        name="Prof. Sharma",
        email="sharma@mitkundapura.edu",
        department="CSE",
        subject="Data Structures",
    )
    db.add(faculty)
    db.flush()

    faculty2 = Faculty(
        name="Prof. Rao",
        email="rao@mitkundapura.edu",
        department="CSE",
        subject="Database Systems",
    )
    db.add(faculty2)
    db.flush()

    courses = [
        Course(code="CS501", name="Data Structures", department="CSE", semester="5", credits=4, faculty_id=faculty.faculty_id),
        Course(code="CS502", name="Database Systems", department="CSE", semester="5", credits=4, faculty_id=faculty2.faculty_id),
        Course(code="CS503", name="Operating Systems", department="CSE", semester="5", credits=3, faculty_id=faculty.faculty_id),
        Course(code="CS504", name="Computer Networks", department="CSE", semester="5", credits=3, faculty_id=faculty2.faculty_id),
    ]
    for c in courses:
        db.add(c)
    db.flush()

    students = [
        Student(name="Ananya", email="ananya@mitkundapura.edu", roll_number="4MK23CS010", department="CSE", semester="5"),
        Student(name="Anvitha", email="anvitha@mitkundapura.edu", roll_number="4MK23CS017", department="CSE", semester="5"),
        Student(name="Ini T V", email="ini@mitkundapura.edu", roll_number="4MK23CS042", department="CSE", semester="5"),
        Student(name="Shabari", email="shabari@mitkundapura.edu", roll_number="4MK23CS094", department="CSE", semester="5"),
    ]
    for s in students:
        db.add(s)
    db.flush()

    from datetime import date, timedelta

    for s in students:
        for c in courses[:3]:
            for i in range(10):
                d = (date.today() - timedelta(days=20 - i)).isoformat()
                status = "present" if i % 4 else "absent"
                db.add(Attendance(
                    student_id=s.student_id,
                    course_id=c.course_id,
                    date=d,
                    status=status,
                    method="qr" if i % 2 == 0 else "manual",
                ))
        db.add(Result(
            student_id=s.student_id,
            course_id=courses[0].course_id,
            internal_marks=38,
            external_marks=42,
            grade="A",
        ))
        db.add(Result(
            student_id=s.student_id,
            course_id=courses[1].course_id,
            internal_marks=35,
            external_marks=39,
            grade="B+",
        ))

    db.add(Timetable(course_id=courses[0].course_id, day="Monday", time="09:00", room="A101"))
    db.add(Timetable(course_id=courses[1].course_id, day="Wednesday", time="11:00", room="A102"))
    db.add(Timetable(course_id=courses[2].course_id, day="Friday", time="14:00", room="B201"))

    db.add(Notification(
        title="Welcome to EduCloude",
        message="Your secure student information platform is live. Keep your credentials safe.",
        role="student",
    ))
    db.add(Notification(
        title="Attendance policy",
        message="Students must maintain at least 75% attendance to be eligible for exams.",
        role="student",
    ))

    db.commit()
    print("Seeded demo data:")
    print(f"  students: {len(students)}")
    print(f"  courses: {len(courses)}")
    print(f"  faculties: 2")
else:
    print("Database already has data, skipping seed.")

db.close()