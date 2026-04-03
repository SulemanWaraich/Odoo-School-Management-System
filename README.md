# 🎓 School Management System (Odoo-Inspired)

A modern, full-stack **School Management Web Application** inspired by ERP workflows like Odoo, tailored specifically for educational institutions.

Built with a powerful stack (**React + FastAPI + MongoDB**), this system provides role-based dashboards and streamlined management for Admins, Teachers, and Students.

---

## 🚀 Features

### 🔐 Authentication & Roles
- JWT-based Authentication
- Role-based Access Control:
  - **Admin**
  - **Teacher**
  - **Student**

---

### 📊 Core Modules (MVP)

#### 👨‍💼 Admin
- Manage Students, Teachers, Courses
- View system-wide dashboards
- Setup Wizard (Phase 2 - In Progress)
- Reports & Exports (Phase 2 - In Progress)

#### 👩‍🏫 Teacher
- Manage assigned courses
- Mark attendance
- Track student progress
- Assign and review assignments

#### 🎓 Student
- View enrolled courses
- Submit assignments (with file uploads)
- Track attendance & weekly progress

---

### 🧩 Functional Modules
- ✅ Student Management (CRUD)
- ✅ Teacher Management (CRUD)
- ✅ Course/Class Management
- ✅ Attendance Management
- ✅ Assignment Management (File Uploads Supported)
- ✅ Weekly Progress Tracking
- ⚙️ Setup Wizard (Bulk Import - Pending Backend)
- 📄 Reports & Export System (CSV/PDF - Pending Backend)

---

## 🎨 UI/UX

- Modern **Admin Dashboard UI**
- Purple / Indigo theme
- Built with:
  - **Shadcn UI**
  - **Recharts**
- Fully Responsive Design

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Context API (Auth Management)
- Shadcn UI
- Recharts

### Backend
- FastAPI
- JWT Authentication

### Database
- MongoDB

### Integrations
- Object Storage (for assignment uploads)
- Google OAuth *(optional)*

---

## 📁 Project Structure

```
/app/
├── backend/
│ ├── server.py
│ ├── seed_data.py
│ └── requirements.txt
│
├── frontend/
│ ├── package.json
│ └── src/
│ ├── App.js
│ ├── contexts/AuthContext.js
│ ├── components/DashboardLayout.js
│ └── pages/
│ ├── admin/
│ ├── teacher/
│ ├── student/
│ ├── LoginPage.js
│ └── RegisterPage.js
│
└── memory/
└── PRD.md
```

---

## ⚙️ Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/school-management-system.git
cd school-management-system
```
2️⃣ Backend Setup (FastAPI)
```bash
cd app/backend
pip install -r requirements.txt
```
Create .env file:
```bash
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
```

Run server:
```bash
uvicorn server:app --reload
```

3️⃣ Frontend Setup (React)
```bash
cd app/frontend
npm install
npm run dev
```

4️⃣ Seed Demo Data
```bash
python seed_data.py
```

🔑 Demo Credentials
```bash
Admin:
Email: admin@school.com
Password: admin123
```

⚠️ Admin registration is disabled from UI for security.

### 🧠 Database Schema (Simplified)

- users: { email, password_hash, role, is_active }
- students: { user_id, student_id, first_name, last_name }
- teachers: { user_id, teacher_id, first_name, last_name }
- courses: { code, name, description, teacher_id }
- enrollments: { student_id, course_id, term }
- attendance_records: { student_id, course_id, date, status }
- assignments: { course_id, title, due_date }
- assignment_submissions: { assignment_id, student_id, file_url, status }
- weekly_progress: { student_id, teacher_id, course_id, week_start, remarks }

---

- ⚠️ Known Issues / Pending Work
- 🚧 Phase 2 (In Progress)
- ❌ Bulk Import (CSV parsing not implemented)
- ❌ Reports Export (PDF/CSV generation pending)

### 🔧 Backend Missing:
Setup Wizard import logic
Reports generation endpoints

### 📌 Roadmap
🔜 Upcoming (P1)
Grading Module
Timetable / Scheduling System

### 🚀 Future (P2)
- Parent Portal
- Fees / Payments Integration
- Notification System
- 🐞 Important Notes
- ⚠️ Shadcn / Radix UI Bug
- Do NOT use empty string (value="") in SelectItem
- Use fallback like: value="all"

### 🧪 Testing
Previous iterations tested successfully
Future testing required for:
Bulk import logic
File export system

### 🤝 Contributing
Contributions are welcome!

## Fork the repo
### Create your feature branch
git checkout -b feature/your-feature

### Commit changes
git commit -m "Add feature"

### Push
git push origin feature/your-feature

📄 License

MIT License

💡 Inspiration

Inspired by ERP systems like Odoo, reimagined for modern school workflows with a clean UI and scalable architecture.

---

If you want next level 🔥:
- I can add **badges (stars, forks, tech stack icons)**
- Add **screenshots section**
- Or turn this into a **portfolio-level README that gets recruiters’ attention**
Just tell me 👍
