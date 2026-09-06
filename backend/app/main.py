from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.routers import user, student, faculty, admin
from app.core.dbutils import engine, Base
from app.models import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EduCloude API",
    description="Secure Cloud Student Information Management System with Privacy Protection",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to EduCloude API"}


@app.get("/health")
def health():
    return {"status": "healthy", "service": "educloude-backend"}


app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(student.router, prefix="/api/student", tags=["student"])
app.include_router(faculty.router, prefix="/api/faculty", tags=["faculty"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
