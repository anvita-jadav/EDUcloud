from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey, Text
from datetime import datetime
from sqlalchemy.orm import declarative_mixin, relationship
from app.core.dbutils import Base
import uuid


def gen_uuid():
    return str(uuid.uuid4())


@declarative_mixin
class Timestamp:
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)


ROLES = ("student", "faculty", "admin")


class User(Timestamp, Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=gen_uuid)
    supabase_uid = Column(String, index=True, nullable=False)
    email = Column(String, nullable=False)
    name = Column(String, default="")
    role = Column(String, default="student", nullable=False)

    profile = relationship("Profile", back_populates="user", uselist=False)


class Profile(Base):
    __tablename__ = "profiles"

    profile_id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    roll_number = Column(String, default="")
    department = Column(String, default="")
    semester = Column(String, default="")
    phone = Column(String, default="")
    address = Column(Text, default="")

    user = relationship("User", back_populates="profile")


class Student(Timestamp, Base):
    __tablename__ = "students"

    student_id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    roll_number = Column(String, nullable=False, default="")
    department = Column(String, default="")
    semester = Column(String, default="")


class Faculty(Timestamp, Base):
    __tablename__ = "faculties"

    faculty_id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    department = Column(String, default="")
    subject = Column(String, default="")


class Course(Base):
    __tablename__ = "courses"

    course_id = Column(String, primary_key=True, default=gen_uuid)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    department = Column(String, default="")
    semester = Column(String, default="")
    credits = Column(Integer, default=0)
    faculty_id = Column(String, ForeignKey("faculties.faculty_id"), nullable=True)


class Attendance(Timestamp, Base):
    __tablename__ = "attendances"

    attendance_id = Column(String, primary_key=True, default=gen_uuid)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.course_id"), nullable=False)
    date = Column(String, nullable=False)
    status = Column(String, nullable=False)  # present / absent
    method = Column(String, default="qr")    # qr / manual


class Result(Base):
    __tablename__ = "results"

    result_id = Column(String, primary_key=True, default=gen_uuid)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.course_id"), nullable=False)
    internal_marks = Column(Float, default=0)
    external_marks = Column(Float, default=0)
    grade = Column(String, default="")


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=True)
    role = Column(String, default="student")
    title = Column(String, nullable=False)
    message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.now, nullable=False)


class Timetable(Base):
    __tablename__ = "timetables"

    timetable_id = Column(String, primary_key=True, default=gen_uuid)
    course_id = Column(String, ForeignKey("courses.course_id"), nullable=False)
    day = Column(String, default="")
    time = Column(String, default="")
    room = Column(String, default="")
