# 🎓 EduCloude

### Secure Cloud-Based Student Information Management System

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![Firebase](https://img.shields.io/badge/Database-Firebase-FFCA28?logo=firebase&logoColor=black)
![Security](https://img.shields.io/badge/Auth-Firebase%20Auth-orange)

🔗 **Live App:** [educloude-frontend.onrender.com/login](https://educloude-frontend.onrender.com/login)

---

## 📖 What is EduCloude?

EduCloude is an all-in-one platform that brings **students, faculty, and admins** together in one place. No more scattered spreadsheets, paper attendance sheets, or WhatsApp groups for results — everything from **attendance** to **grades** to **notifications** happens securely on one dashboard, tailored to who's logged in.

Think of it as a digital campus office that lives in the cloud. 🌐

---

## 🧑‍🎓 🧑‍🏫 🧑‍💼 Who is it for?

EduCloude has **three different experiences**, depending on your role:

```
┌─────────────────────────────────────────────────────────────┐
│                        EduCloude                            │
├───────────────────┬───────────────────┬─────────────────────┤
│      STUDENT       │      FACULTY       │        ADMIN        │
│  📱 attend & learn  │  📋 teach & grade  │  🏛️ run the system   │
└───────────────────┴───────────────────┴─────────────────────┘
```

---

## ✨ Features by Role

### 🧑‍🎓 Student

| Feature | What it does |
|---|---|
| 🔐 **Easy Login** | Sign up with email/password or one-tap **Google login** |
| 🏠 **Personal Dashboard** | See your profile and everything relevant to you at a glance |
| ✅ **QR Attendance** | Just **scan a QR code** in class to mark yourself present — no roll call needed |
| 📊 **Attendance Tracker** | Instantly check how many classes you've attended |
| 📝 **Results & Grades** | View marks and auto-calculated grades as soon as faculty enter them |
| 🔔 **Notifications** | Get pinged the moment admin sends an announcement |
| 🤖 **AI Chatbot** | Ask the built-in assistant quick questions about your academic info |

### 🧑‍🏫 Faculty

| Feature | What it does |
|---|---|
| 🏠 **Faculty Dashboard** | Snapshot of your courses and class stats |
| 📷 **Generate Attendance QR** | Create a live QR code — students scan it, attendance is marked instantly |
| ✍️ **Manual Attendance** | Mark attendance the traditional way when needed |
| 🧮 **Enter Marks** | Input scores and let the system **auto-calculate grades** |
| 👥 **Student Reports** | View class performance and attendance reports at a glance |

### 🧑‍💼 Admin

| Feature | What it does |
|---|---|
| 👨‍🎓 **Manage Students** | Add, update, or remove student records |
| 👩‍🏫 **Manage Faculty** | Add, update, or remove faculty records |
| 📚 **Manage Courses** | Create and organize courses across the institution |
| 🗓️ **Manage Timetable** | Build and update the class schedule |
| 📈 **System Reports** | Get a bird's-eye view of the whole institution's data |
| 📢 **Send Notifications** | Broadcast announcements to students and faculty |

---

## 🔄 How It All Works (In Plain English)

```
   Student scans QR  ──▶  Backend verifies & records  ──▶  Attendance updates live
        📱                        ⚙️                              📊

   Faculty enters marks ──▶ System auto-calculates grade ──▶ Student sees result
         ✍️                          🧮                             📝

   Admin sends notice  ──▶  Stored in Firestore  ──▶  Appears in everyone's feed
         📢                       ☁️                          🔔
```

Behind the scenes:
1. **You log in** → Firebase confirms who you are (student/faculty/admin)
2. **The app shows only what's relevant to your role** → this is called Role-Based Access Control
3. **Every action** (attendance, marks, notifications) is saved securely in the cloud (Firestore) and updates in real time

---

## 🔒 Why It's Secure

- 🔑 Login is handled by **Firebase Authentication** — the same trusted system used by countless production apps
- 🛡️ **Role-based permissions** — students can never see faculty/admin-only screens, and vice versa
- 🔐 Passwords are never stored in plain text — hashing & optional MFA handled by Firebase
- 🌐 All data travels over **HTTPS/SSL** — encrypted in transit
- 🚧 Firestore **security rules** add an extra wall around your data

---

## 🏗️ Under the Hood (For the Curious)

| Layer | Technology | Job |
|---|---|---|
| 🎨 **Presentation** | React.js (Vite) | Everything you see — dashboards, QR scanner, chatbot |
| ⚙️ **Application** | FastAPI (Python) | Verifies who you are, applies role rules, serves data |
| 🗄️ **Data** | Firebase (Firestore) | Stores everything safely in the cloud |

---

## 🚀 Try It Now

No installation needed — just open it in your browser:

### 👉 [**educloude-frontend.onrender.com/login**](https://educloude-frontend.onrender.com/login)

---
ADMIN_USERNAME=EDU_project
ADMIN_PASSWORD=EDUcloud@987

<p align="center"><i>EduCloude — one platform, every role, all in the cloud. ☁️🎓</i></p>
