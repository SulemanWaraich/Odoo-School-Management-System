"""
Seed script to populate demo data for School Management System
Run with: python seed_data.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone, timedelta

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

async def seed_data():
    print("🌱 Starting seed process...")
    
    # ============ TEACHERS ============
    teachers_data = [
        {"name": "Dr. Sarah Johnson", "email": "sarah.johnson@school.com", "department": "Mathematics", "qualification": "Ph.D. Mathematics"},
        {"name": "Prof. Michael Chen", "email": "michael.chen@school.com", "department": "Science", "qualification": "M.Sc. Physics"},
        {"name": "Ms. Emily Davis", "email": "emily.davis@school.com", "department": "English", "qualification": "M.A. English Literature"},
    ]
    
    teacher_ids = []
    for t in teachers_data:
        existing = await db.users.find_one({"email": t["email"]})
        if existing:
            teacher = await db.teachers.find_one({"user_id": existing["user_id"]})
            if teacher:
                teacher_ids.append(teacher["id"])
            print(f"  ⏭️  Teacher {t['name']} already exists")
            continue
            
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        teacher_id = f"tch_{uuid.uuid4().hex[:8]}"
        
        await db.users.insert_one({
            "user_id": user_id,
            "email": t["email"],
            "name": t["name"],
            "role": "teacher",
            "password_hash": hash_password("teacher123"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        await db.teachers.insert_one({
            "id": teacher_id,
            "user_id": user_id,
            "employee_id": f"EMP{uuid.uuid4().hex[:6].upper()}",
            "department": t["department"],
            "qualification": t["qualification"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        teacher_ids.append(teacher_id)
        print(f"  ✅ Created teacher: {t['name']}")
    
    # ============ STUDENTS ============
    students_data = [
        {"name": "John Smith", "email": "john.smith@school.com", "grade": "Grade 10", "section": "A"},
        {"name": "Emma Wilson", "email": "emma.wilson@school.com", "grade": "Grade 10", "section": "A"},
        {"name": "James Brown", "email": "james.brown@school.com", "grade": "Grade 10", "section": "B"},
        {"name": "Olivia Taylor", "email": "olivia.taylor@school.com", "grade": "Grade 11", "section": "A"},
        {"name": "William Anderson", "email": "william.anderson@school.com", "grade": "Grade 11", "section": "B"},
    ]
    
    student_ids = []
    for s in students_data:
        existing = await db.users.find_one({"email": s["email"]})
        if existing:
            student = await db.students.find_one({"user_id": existing["user_id"]})
            if student:
                student_ids.append(student["id"])
            print(f"  ⏭️  Student {s['name']} already exists")
            continue
            
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        student_id = f"std_{uuid.uuid4().hex[:8]}"
        
        await db.users.insert_one({
            "user_id": user_id,
            "email": s["email"],
            "name": s["name"],
            "role": "student",
            "password_hash": hash_password("student123"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        await db.students.insert_one({
            "id": student_id,
            "user_id": user_id,
            "student_id": f"STD{uuid.uuid4().hex[:6].upper()}",
            "grade": s["grade"],
            "section": s["section"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        student_ids.append(student_id)
        print(f"  ✅ Created student: {s['name']}")
    
    # ============ COURSES ============
    courses_data = [
        {"name": "Algebra & Geometry", "code": "MATH101", "grade": "Grade 10", "description": "Fundamentals of algebra and geometry for 10th grade"},
        {"name": "Physics Fundamentals", "code": "PHY101", "grade": "Grade 10", "description": "Introduction to physics concepts and experiments"},
        {"name": "English Literature", "code": "ENG101", "grade": "Grade 10", "description": "Study of classic and modern literature"},
        {"name": "Advanced Mathematics", "code": "MATH201", "grade": "Grade 11", "description": "Calculus and advanced algebra"},
        {"name": "Chemistry Basics", "code": "CHEM101", "grade": "Grade 11", "description": "Introduction to chemistry and lab work"},
    ]
    
    course_ids = []
    for i, c in enumerate(courses_data):
        existing = await db.courses.find_one({"code": c["code"]})
        if existing:
            course_ids.append(existing["id"])
            print(f"  ⏭️  Course {c['name']} already exists")
            continue
            
        course_id = f"crs_{uuid.uuid4().hex[:8]}"
        teacher_id = teacher_ids[i % len(teacher_ids)] if teacher_ids else None
        
        await db.courses.insert_one({
            "id": course_id,
            "name": c["name"],
            "code": c["code"],
            "description": c["description"],
            "grade": c["grade"],
            "teacher_id": teacher_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        course_ids.append(course_id)
        print(f"  ✅ Created course: {c['name']} (assigned to teacher)")
    
    # ============ ENROLLMENTS ============
    print("\n📚 Creating enrollments...")
    enrollment_count = 0
    
    # Enroll Grade 10 students in Grade 10 courses
    grade10_students = student_ids[:3] if len(student_ids) >= 3 else student_ids
    grade10_courses = course_ids[:3] if len(course_ids) >= 3 else course_ids
    
    for student_id in grade10_students:
        for course_id in grade10_courses:
            existing = await db.enrollments.find_one({"student_id": student_id, "course_id": course_id})
            if existing:
                continue
            await db.enrollments.insert_one({
                "id": f"enr_{uuid.uuid4().hex[:8]}",
                "student_id": student_id,
                "course_id": course_id,
                "enrolled_at": datetime.now(timezone.utc).isoformat()
            })
            enrollment_count += 1
    
    # Enroll Grade 11 students in Grade 11 courses
    grade11_students = student_ids[3:] if len(student_ids) > 3 else []
    grade11_courses = course_ids[3:] if len(course_ids) > 3 else []
    
    for student_id in grade11_students:
        for course_id in grade11_courses:
            existing = await db.enrollments.find_one({"student_id": student_id, "course_id": course_id})
            if existing:
                continue
            await db.enrollments.insert_one({
                "id": f"enr_{uuid.uuid4().hex[:8]}",
                "student_id": student_id,
                "course_id": course_id,
                "enrolled_at": datetime.now(timezone.utc).isoformat()
            })
            enrollment_count += 1
    
    print(f"  ✅ Created {enrollment_count} enrollments")
    
    # ============ ATTENDANCE RECORDS ============
    print("\n📋 Creating attendance records...")
    attendance_count = 0
    statuses = ["present", "present", "present", "present", "absent", "late"]  # Weighted towards present
    
    for days_ago in range(7):
        date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        for student_id in student_ids[:3]:  # Grade 10 students
            for course_id in grade10_courses:
                existing = await db.attendance_records.find_one({
                    "student_id": student_id, "course_id": course_id, "date": date
                })
                if existing:
                    continue
                import random
                await db.attendance_records.insert_one({
                    "id": f"att_{uuid.uuid4().hex[:8]}",
                    "student_id": student_id,
                    "course_id": course_id,
                    "date": date,
                    "status": random.choice(statuses),
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                attendance_count += 1
    
    print(f"  ✅ Created {attendance_count} attendance records")
    
    # ============ ASSIGNMENTS ============
    print("\n📝 Creating assignments...")
    assignments_data = [
        {"title": "Algebra Quiz 1", "course_idx": 0, "due_days": 3, "description": "Complete problems 1-20 from Chapter 3"},
        {"title": "Physics Lab Report", "course_idx": 1, "due_days": 5, "description": "Write a lab report on the pendulum experiment"},
        {"title": "Essay: Shakespeare", "course_idx": 2, "due_days": 7, "description": "Write a 500-word essay on Hamlet's character development"},
        {"title": "Calculus Homework", "course_idx": 3, "due_days": 2, "description": "Solve integration problems from Chapter 5"},
    ]
    
    assignment_ids = []
    for a in assignments_data:
        if a["course_idx"] >= len(course_ids):
            continue
        course_id = course_ids[a["course_idx"]]
        existing = await db.assignments.find_one({"title": a["title"], "course_id": course_id})
        if existing:
            assignment_ids.append(existing["id"])
            print(f"  ⏭️  Assignment {a['title']} already exists")
            continue
            
        assignment_id = f"asg_{uuid.uuid4().hex[:8]}"
        await db.assignments.insert_one({
            "id": assignment_id,
            "course_id": course_id,
            "title": a["title"],
            "description": a["description"],
            "due_date": (datetime.now(timezone.utc) + timedelta(days=a["due_days"])).strftime("%Y-%m-%d"),
            "max_score": 100,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        assignment_ids.append(assignment_id)
        print(f"  ✅ Created assignment: {a['title']}")
    
    # ============ WEEKLY PROGRESS ============
    print("\n📈 Creating weekly progress records...")
    progress_remarks = [
        "Excellent participation and understanding of concepts",
        "Good progress, needs more practice with problem-solving",
        "Showing improvement, keep up the good work",
        "Strong analytical skills, exceeds expectations",
        "Consistent effort, meeting all learning objectives"
    ]
    
    import random
    progress_count = 0
    week_start = (datetime.now(timezone.utc) - timedelta(days=datetime.now().weekday())).strftime("%Y-%m-%d")
    
    for i, student_id in enumerate(student_ids[:3]):
        for course_id in grade10_courses:
            existing = await db.weekly_progress.find_one({
                "student_id": student_id, "course_id": course_id, "week_start": week_start
            })
            if existing:
                continue
            await db.weekly_progress.insert_one({
                "id": f"prg_{uuid.uuid4().hex[:8]}",
                "student_id": student_id,
                "course_id": course_id,
                "week_start": week_start,
                "remarks": random.choice(progress_remarks),
                "performance_score": random.randint(70, 98),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            progress_count += 1
    
    print(f"  ✅ Created {progress_count} progress records")
    
    # ============ ANNOUNCEMENTS ============
    print("\n📢 Creating announcements...")
    announcements = [
        {"title": "Welcome to New Semester!", "content": "We're excited to start the new academic year. Please check your course schedules and contact your teachers if you have any questions.", "target": "all"},
        {"title": "Parent-Teacher Meeting", "content": "Parent-teacher meetings will be held next Friday. Please confirm your attendance.", "target": "all"},
        {"title": "Assignment Submission Reminder", "content": "All pending assignments must be submitted by end of this week.", "target": "student"},
    ]
    
    for ann in announcements:
        existing = await db.announcements.find_one({"title": ann["title"]})
        if existing:
            print(f"  ⏭️  Announcement '{ann['title']}' already exists")
            continue
        await db.announcements.insert_one({
            "id": f"ann_{uuid.uuid4().hex[:8]}",
            "title": ann["title"],
            "content": ann["content"],
            "target_role": ann["target"],
            "course_id": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        print(f"  ✅ Created announcement: {ann['title']}")
    
    # ============ UPDATE TEST CREDENTIALS ============
    print("\n📄 Updating test credentials file...")
    credentials = """# Test Credentials for School Management System

## Admin Account
- Email: admin@school.com
- Password: admin123
- Role: admin

## Teacher Accounts
- Email: sarah.johnson@school.com | Password: teacher123 | Dr. Sarah Johnson (Mathematics)
- Email: michael.chen@school.com | Password: teacher123 | Prof. Michael Chen (Science)
- Email: emily.davis@school.com | Password: teacher123 | Ms. Emily Davis (English)

## Student Accounts
- Email: john.smith@school.com | Password: student123 | John Smith (Grade 10-A)
- Email: emma.wilson@school.com | Password: student123 | Emma Wilson (Grade 10-A)
- Email: james.brown@school.com | Password: student123 | James Brown (Grade 10-B)
- Email: olivia.taylor@school.com | Password: student123 | Olivia Taylor (Grade 11-A)
- Email: william.anderson@school.com | Password: student123 | William Anderson (Grade 11-B)

## Courses Created
- MATH101: Algebra & Geometry (Grade 10) - Dr. Sarah Johnson
- PHY101: Physics Fundamentals (Grade 10) - Prof. Michael Chen
- ENG101: English Literature (Grade 10) - Ms. Emily Davis
- MATH201: Advanced Mathematics (Grade 11) - Dr. Sarah Johnson
- CHEM101: Chemistry Basics (Grade 11) - Prof. Michael Chen

## Enrollments
- Grade 10 students (John, Emma, James) enrolled in MATH101, PHY101, ENG101
- Grade 11 students (Olivia, William) enrolled in MATH201, CHEM101
"""
    
    from pathlib import Path
    Path("/tmp").mkdir(parents=True, exist_ok=True)
    with open("/tmp/test_credentials.md", "w") as f:
        f.write(credentials)
    
    print("\n✅ Seed completed successfully!")
    print("\n📋 Summary:")
    print(f"   - Teachers: {len(teacher_ids)}")
    print(f"   - Students: {len(student_ids)}")
    print(f"   - Courses: {len(course_ids)}")
    print(f"   - Enrollments: {enrollment_count}")
    print(f"   - Attendance Records: {attendance_count}")
    print(f"   - Assignments: {len(assignment_ids)}")
    print(f"   - Progress Records: {progress_count}")

if __name__ == "__main__":
    asyncio.run(seed_data())
