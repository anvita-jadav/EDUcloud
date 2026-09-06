# EduCloude

**Secure Cloud Student Information Management System with Privacy Protection**

EduCloude centralizes student, faculty, and admin workflows on one secure platform:
React.js frontend, FastAPI backend, and Firebase for authentication + NoSQL database
(Firestore).

## Architecture (Three-Tier)

| Tier | Tech |
|------|------|
| Presentation | React.js (Vite) — dashboards, attendance, results, QR check-in, AI chatbot |
| Application | FastAPI (Python) — Firebase ID token auth, RBAC, REST APIs, validation |
| Data | Firebase (Cloud Firestore) |

## Security

- Firebase Authentication (Google-managed identity) — ID tokens verified with the Firebase Admin SDK on every request
- Role-Based Access Control (student / faculty / admin) enforced per router
- Password hashing, MFA, and session handling managed by Firebase Auth
- HTTPS / SSL for data in transit (Firebase + deployment)
- Firebase Security Rules can restrict Firestore access (backend enforces through Admin SDK)

## Project Structure

```
educloude/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── core/            # config, firebase admin + firestore utils, token utils
│   │   ├── routers/         # user, student, faculty, admin routers
│   │   └── main.py          # app entry point
│   ├── seed.py              # demo data (Firestore)
│   ├── requirements.txt
│   ├── firebase-service-account.json   # (secret, NOT committed)
│   └── .env.sample
└── frontend/                 # React.js (Vite)
    └── src/
        ├── components/       # layout, QR scanner, chatbot, tables
        ├── context/          # auth context (Firebase Auth)
        ├── lib/              # firebase client + API helper
        └── pages/            # login/register + role pages
```

## Setup

### 1. Firebase project

Create a project at [console.firebase.google.com](https://console.firebase.google.com),
then enable:

- **Authentication** → Sign-in method → enable `Email/Password` and `Google`
- **Firestore Database** → create database (production mode)

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # or venv\Scripts\activate on Windows
pip install -r requirements.txt

cp .env.sample .env             # fill in Firebase project id
```

The backend needs a **service account** so Firebase Admin can verify tokens and access Firestore:

1. Firebase console → Project settings → **Service accounts**
2. **Generate new private key** → download the JSON
3. Save it as `backend/firebase-service-account.json` (never commit this file)

```bash
# optional: seed demo data
python seed.py

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000   # http://localhost:8000
```

API docs (Swagger UI): http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install

cp .env.sample .env
```

Fill the web app config from Firebase console → Project settings → **General** →
*Your apps* → Web app (`</>`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

```bash
npm run dev                     # http://localhost:5173
```

## Roles

### Student
- Register / login (or "Continue with Google")
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
| POST | `/api/user/oauth/register` | any (Google OAuth) |
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