# EduCloude

**Secure Cloud Student Information Management System with Privacy Protection**

EduCloude centralizes student, faculty, and admin workflows on one secure platform:
React.js frontend, FastAPI backend, and Supabase for authentication (JWT) + database.

## Architecture (Three-Tier)

| Tier | Tech |
|------|------|
| Presentation | React.js (Vite) — dashboards, attendance, results, QR check-in, AI chatbot |
| Application | FastAPI (Python) — JWT auth, RBAC, REST APIs, validation |
| Data | Supabase (Postgres) / SQLite for local dev |

## Security

- Supabase JWT authentication (HS256) verified on every request
- Role-Based Access Control (student / faculty / admin)
- bcrypt password hashing handled by Supabase Auth
- HTTPS / SSL for data in transit (Supabase + deployment)
- Encrypted storage for sensitive data

## Project Structure

```
educloude/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── core/            # config, database utils, JWT utils
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routers/         # user, student, faculty, admin routers
│   │   └── main.py          # app entry point
│   ├── seed.py              # demo data
│   ├── requirements.txt
│   └── .env.sample
└── frontend/                 # React.js (Vite)
    └── src/
        ├── components/       # layout, QR scanner, chatbot, tables
        ├── context/          # auth context
        ├── lib/              # supabase client + API helper
        └── pages/            # login/register + role pages
```

## Setup

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com). Get credentials from
`Project Settings > API`:

- `SUPABASE_PROJECT_ID` — Project Settings > General > Project ID
- `SUPABASE_URL` — Project Settings > API > Project URL
- `SUPABASE_ANON_KEY` — Project Settings > API > anon public key
- `SUPABASE_JWT_SECRET` — Project Settings > API > JWT Settings > JWT Secret

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # or venv\Scripts\activate on Windows
pip install -r requirements.txt

cp .env.sample .env             # fill in Supabase credentials

# optional: seed demo data
python seed.py

python main.py                  # http://localhost:8000
```

API docs (Swagger UI): http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install

cp .env.sample .env             # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

npm run dev                     # http://localhost:5173
```

## Roles

### Student
- Register / login
- Dashboard & profile
- View attendance + QR check-in (scan course QR in class)
- View results
- Notifications
- AI chatbot (rule-based demo)

### Faculty
- Dashboard (courses, stats)
- Manage attendance (manual + generate QR for class check-in)
- Enter marks (auto grade computation)
- View students & reports

### Admin
- Manage students, faculty, courses
- Manage timetable
- View system reports
- Send notifications

## API Endpoints

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/user/register` | any |
| GET | `/api/user/me` | any |
| GET | `/api/student/dashboard` | student |
| GET | `/api/student/attendance` | student |
| POST | `/api/student/attendance/checkin` | student |
| GET | `/api/student/results` | student |
| GET | `/api/faculty/dashboard` | faculty |
| POST | `/api/faculty/attendance/mark` | faculty |
| POST | `/api/faculty/results/enter` | faculty |
| GET | `/api/faculty/reports` | faculty |
| GET/POST | `/api/admin/students` | admin |
| GET/POST | `/api/admin/faculty` | admin |
| GET/POST | `/api/admin/courses` | admin |
| GET/POST | `/api/admin/timetable` | admin |
| GET | `/api/admin/reports` | admin |
| POST | `/api/admin/notifications` | admin |