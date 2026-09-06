import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SUPABASE_PROJECT_ID = os.getenv("SUPABASE_PROJECT_ID")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///educloude.db")
