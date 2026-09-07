from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import Config

router = APIRouter()

SYSTEM_PROMPT = (
    "You are EDUtech AI, the friendly personal assistant inside the EduCloude student "
    "information management system. You identify yourself as 'EDUtech AI' on every "
    "conversation.\n\n"
    "Your knowledge is focused on two areas:\n"
    "1) Facts about the app itself: features like class QR attendance (faculty set a "
    "class start time and duration, students scan the QR during that window to be "
    "marked present), results and grades, marks entry, timetables, the admin panel, "
    "and the student/faculty/admin roles.\n"
    "2) General educational information about the subjects that are part of this "
    "system, which are computer science courses: Data Structures & Algorithms, "
    "Database Management Systems, Operating Systems, Computer Networks, Object "
    "Oriented Programming (Java), Python Programming, Artificial Intelligence & "
    "Machine Learning, Web Technologies, Cloud Computing, and Cyber Security "
    "Essentials. You can give clear, helpful, learning-oriented explanations on "
    "these topics.\n\n"
    "RULES:\n"
    "- Always stay helpful, warm, and concise (a few short sentences or a short list).\n"
    "- If asked about anything unrelated to this app or these subjects, politely steer "
    "the conversation back to the app and its subjects.\n"
    "- You do not expose private student data or passwords; give general guidance only.\n"
    "- Reply in the same language the user writes in."
)


class ChatPayload(BaseModel):
    message: str
    history: list = []


@router.post("/chat")
def chat(payload: ChatPayload):
    if not Config.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="The AI assistant is not configured yet. Please add a Gemini API key.",
        )

    if not (payload.message or "").strip():
        raise HTTPException(status_code=422, detail="Message is required")

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=Config.GEMINI_API_KEY)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not reach the AI service")

    # Gemini enforces strict turn ordering: the conversation must start with a
    # user message and roles must alternate (no empty or duplicate turns).
    # Drop the canned bot greeting and any blank history entries, trim leading
    # assistant turns, then merge duplicate consecutive roles.
    contents = []
    for m in (payload.history or [])[-10:]:
        text = (m.get("text") or "").strip()
        if not text:
            continue
        role = "assistant" if m.get("from") == "bot" else "user"
        contents.append({"role": role, "parts": [{"text": text}]})

    while contents and contents[0]["role"] == "assistant":
        contents.pop(0)

    merged = []
    for turn in contents + [{"role": "user", "parts": [{"text": payload.message.strip()}]}]:
        if merged and merged[-1]["role"] == turn["role"]:
            merged[-1]["parts"][0]["text"] += "\n" + turn["parts"][0]["text"]
        else:
            merged.append(turn)

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
            contents=merged,
        )
        text = (response.text or "").strip()
        if not text:
            text = "Sorry, I could not find an answer to that right now."
    except Exception as e:
        msg = str(e)
        if "suspended" in msg.lower() or "permission_denied" in msg.lower():
            raise HTTPException(
                status_code=503,
                detail="The EDUtech AI assistant is experiencing a temporary issue with its connection. Please try again later.",
            )
        raise HTTPException(status_code=502, detail=f"AI request failed: {e}")

    return {"reply": text}
