import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import Config, validate_config
from app.routers import user, student, faculty, admin, chatbot

logger = logging.getLogger(__name__)


app = FastAPI(
    title="EduCloude API",
    description="Secure Cloud Student Information Management System with Privacy Protection",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_origin_regex=Config.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.on_event("startup")
def startup() -> None:
    validate_config()
    try:
        from app.core import firebase
        firebase.get_app()
    except Exception as e:
        logger.error("Firebase initialization failed: %s", e)
        raise


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
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["chatbot"])


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)