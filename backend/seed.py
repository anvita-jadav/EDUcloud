import sys
from datetime import date, timedelta
from app.core.firestore_utils import (
    add_item, list_collection, gen_id, now,
)


def seed():
    try:
        if list_collection("courses") or list_collection("users"):
            print("Database already has data, skipping seed.")
            return

        f1 = gen_id()
        add_item("faculties", {
            "faculty_id": f1,
            "name": "Prof. Sharma",
            "email": "sharma@mitkundapura.edu",
            "department": "CSE",
            "subject": "Data Structures",
            "created_at": now(),
            "updated_at": now(),
        })

        f2 = gen_id()
        add_item("faculties", {
            "faculty_id": f2,
            "name": "Prof. Rao",
            "email": "rao@mitkundapura.edu",
            "department": "CSE",
            "subject": "Database Systems",
            "created_at": now(),
            "updated_at": now(),
        })

        courses_spec = [
            ("CS501", "Data Structures", "CSE", "5", 4, f1),
            ("CS502", "Database Systems", "CSE", "5", 4, f2),
            ("CS503", "Operating Systems", "CSE", "5", 3, f1),
            ("CS504", "Computer Networks", "CSE", "5", 3, f2),
        ]
        courses = []
        for code, name, dept, sem, credits, fid in courses_spec:
            cid = gen_id()
            add_item("courses", {
                "course_id": cid,
                "code": code,
                "name": name,
                "department": dept,
                "semester": sem,
                "credits": credits,
                "faculty_id": fid,
                "created_at": now(),
                "updated_at": now(),
            })
            courses.append(cid)

        students_spec = [
            ("Ananya", "ananya@mitkundapura.edu", "4MK23CS010"),
            ("Anvitha", "anvitha@mitkundapura.edu", "4MK23CS017"),
            ("Ini T V", "ini@mitkundapura.edu", "4MK23CS042"),
            ("Shabari", "shabari@mitkundapura.edu", "4MK23CS094"),
        ]
        students = []
        for name, email, roll in students_spec:
            sid = gen_id()
            user_id = gen_id()
            add_item("students", {
                "student_id": sid,
                "user_id": user_id,
                "name": name,
                "email": email,
                "roll_number": roll,
                "department": "CSE",
                "semester": "5",
                "created_at": now(),
                "updated_at": now(),
            })
            # Placeholder user document (uid unknown until Firebase auth).
            # The register endpoint will link a real uid when the user signs up
            # with the same email.
            add_item("users", {
                "user_id": user_id,
                "email": email,
                "name": name,
                "role": "student",
                "uid": email,
                "created_at": now(),
                "updated_at": now(),
            })
            add_item("profiles", {
                "profile_id": gen_id(),
                "user_id": user_id,
                "roll_number": roll,
                "department": "CSE",
                "semester": "5",
            })
            students.append(sid)

        for sid in students:
            for cid in courses[:3]:
                for i in range(10):
                    d = (date.today() - timedelta(days=20 - i)).isoformat()
                    status = "absent" if i % 4 == 0 else "present"
                    add_item("attendances", {
                        "attendance_id": gen_id(),
                        "student_id": sid,
                        "course_id": cid,
                        "date": d,
                        "status": status,
                        "method": "qr" if i % 2 == 0 else "manual",
                        "created_at": now(),
                    })
            add_item("results", {
                "result_id": gen_id(),
                "student_id": sid,
                "course_id": courses[0],
                "internal_marks": 38,
                "external_marks": 42,
                "grade": "A",
                "created_at": now(),
            })
            add_item("results", {
                "result_id": gen_id(),
                "student_id": sid,
                "course_id": courses[1],
                "internal_marks": 35,
                "external_marks": 39,
                "grade": "B+",
                "created_at": now(),
            })

        add_item("timetable", {"timetable_id": gen_id(), "course_id": courses[0], "day": "Monday", "time": "09:00", "room": "A101", "created_at": now()})
        add_item("timetable", {"timetable_id": gen_id(), "course_id": courses[1], "day": "Wednesday", "time": "11:00", "room": "A102", "created_at": now()})
        add_item("timetable", {"timetable_id": gen_id(), "course_id": courses[2], "day": "Friday", "time": "14:00", "room": "B201", "created_at": now()})

        add_item("notifications", {
            "notification_id": gen_id(),
            "title": "Welcome to EduCloude",
            "message": "Your secure student information platform is live. Keep your credentials safe.",
            "role": "student",
            "user_id": None,
            "created_at": now(),
        })
        add_item("notifications", {
            "notification_id": gen_id(),
            "title": "Attendance policy",
            "message": "Students must maintain at least 75% attendance to be eligible for exams.",
            "role": "student",
            "user_id": None,
            "created_at": now(),
        })

        print("Seeded demo data:")
        print(f"  students: {len(students)}")
        print(f"  courses: {len(courses)}")
        print(f"  faculties: 2")
    except Exception as e:
        print(f"Seeding failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    seed()