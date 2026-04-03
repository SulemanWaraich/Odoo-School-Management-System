# School Management System - PRD

## Original Problem Statement
Build a modern school management web application inspired by Odoo ERP with three roles: Admin, Teacher, and Student. Features authentication (JWT + Google OAuth), Student/Teacher/Course Management, Attendance, Assignments with file uploads, Weekly Progress Tracking, and Role-based Dashboards.

## User Personas

### Admin
- School administrators who manage all aspects of the system
- Create and manage students, teachers, courses
- Monitor attendance, assignments, and progress across all classes
- Create school-wide announcements

### Teacher  
- Faculty members assigned to specific courses
- Mark daily attendance for their classes
- Create and manage assignments
- Track student weekly progress
- View submissions from students

### Student
- Learners enrolled in multiple courses
- View enrolled courses and instructors
- Check attendance history and percentage
- Submit assignments (with file upload)
- View weekly progress reports and announcements

## Core Requirements (Static)

### Authentication
- [x] JWT-based email/password login
- [x] Google OAuth integration (Emergent Auth)
- [x] Role-based access control (admin/teacher/student)
- [x] Secure cookie-based session management
- [x] Brute force protection

### Admin Module
- [x] Dashboard with stats (students, teachers, courses, attendance)
- [x] Student management (CRUD, enrollment)
- [x] Teacher management (CRUD)
- [x] Course management (CRUD, assign teachers)
- [x] Attendance overview with filters
- [x] Assignment overview
- [x] Progress overview
- [x] Announcement management

### Teacher Module
- [x] Dashboard with assigned courses and stats
- [x] My Courses view
- [x] Mark attendance (daily, per course)
- [x] Create/manage assignments
- [x] Record weekly progress for students
- [x] View student submissions

### Student Module
- [x] Dashboard with enrollment, attendance %, pending assignments
- [x] My Courses view with instructor info
- [x] Attendance history
- [x] Assignment list with submit functionality
- [x] Progress tracking with score trends
- [x] View announcements

## What's Been Implemented

### April 3, 2026 - MVP Complete
- Full backend API with FastAPI + MongoDB
- React frontend with Shadcn UI components
- Purple/indigo theme, Odoo-inspired sidebar layout
- JWT + Google OAuth authentication
- All three role dashboards fully functional
- Recharts for data visualization
- File upload for assignment submissions (object storage)

### April 3, 2026 - Seed Data Added
- 3 Teachers: Dr. Sarah Johnson (Math), Prof. Michael Chen (Science), Ms. Emily Davis (English)
- 5 Students: John Smith, Emma Wilson, James Brown (Grade 10), Olivia Taylor, William Anderson (Grade 11)
- 5 Courses: MATH101, PHY101, ENG101 (Grade 10), MATH201, CHEM101 (Grade 11)
- Enrollments: Grade 10 students in Grade 10 courses, Grade 11 in Grade 11 courses
- Sample attendance records (7 days)
- 4 Assignments with due dates
- Weekly progress records with scores

## Test Credentials

### Admin
- Email: admin@school.com
- Password: admin123

### Teachers
- sarah.johnson@school.com / teacher123
- michael.chen@school.com / teacher123
- emily.davis@school.com / teacher123

### Students
- john.smith@school.com / student123
- emma.wilson@school.com / student123
- james.brown@school.com / student123
- olivia.taylor@school.com / student123
- william.anderson@school.com / student123

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Authentication system
- [x] Role-based dashboards
- [x] Course management
- [x] Attendance marking
- [x] Assignment management
- [x] Progress tracking

### P1 - Important (Next)
- [ ] User Management page for admin (promote users to admin)
- [ ] Grade/marks management for assignments
- [ ] Bulk import students via CSV
- [ ] Email notifications for assignments

### P2 - Nice to Have
- [ ] Timetable/schedule management
- [ ] Parent portal
- [ ] Fees/payments module
- [ ] Report card generation
- [ ] Mobile-responsive improvements
- [ ] Dark mode support

## Architecture

### Backend
- FastAPI (Python 3.11)
- MongoDB (motor async driver)
- JWT authentication
- Emergent Object Storage for files
- RESTful API design

### Frontend
- React 18
- Tailwind CSS
- Shadcn UI components
- Recharts for visualizations
- Axios for API calls

### Database Collections
- users (authentication)
- students (profiles)
- teachers (profiles)
- courses
- enrollments
- attendance_records
- assignments
- submissions
- weekly_progress
- announcements
- user_sessions (OAuth)
- login_attempts (brute force protection)

## Next Tasks
1. Add User Management page for admin role assignment
2. Implement grading system for submitted assignments
3. Add CSV import for bulk student/teacher creation
4. Test file upload flow for student submissions
