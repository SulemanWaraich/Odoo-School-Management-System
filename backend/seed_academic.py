import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone, timedelta

async def seed_academic():
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "school_management")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🎓 Seeding academic data...")
    
    # Get existing data
    courses = await db.courses.find({}).to_list(1000)
    students = await db.students.find({}).to_list(1000)
    teachers = await db.teachers.find({}).to_list(1000)
    
    # Create exams for each course
    exams_created = 0
    for course in courses:
        # Check if exams exist
        existing = await db.exams.find_one({"course_id": course["id"]})
        if existing:
            continue
            
        exams = [
            {"title": f"Quiz 1 - {course['name']}", "exam_type": "quiz", "max_marks": 20},
            {"title": f"Midterm - {course['name']}", "exam_type": "midterm", "max_marks": 50},
            {"title": f"Final Exam - {course['name']}", "exam_type": "final", "max_marks": 100}
        ]
        
        for i, exam_data in enumerate(exams):
            exam_doc = {
                "id": f"exam_{uuid.uuid4().hex[:8]}",
                "course_id": course["id"],
                "title": exam_data["title"],
                "exam_type": exam_data["exam_type"],
                "date": (datetime.now() + timedelta(days=i*14)).strftime("%Y-%m-%d"),
                "max_marks": exam_data["max_marks"],
                "description": f"Assessment for {course['name']}",
                "created_by": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.exams.insert_one(exam_doc)
            exams_created += 1
    
    print(f"  ✅ Created {exams_created} exams")
    
    # Create timetable entries
    tt_created = 0
    days = [0, 1, 2, 3, 4]  # Monday to Friday
    time_slots = [
        ("09:00", "10:00"),
        ("10:00", "11:00"),
        ("11:00", "12:00"),
        ("14:00", "15:00"),
        ("15:00", "16:00")
    ]
    rooms = ["Room 101", "Room 102", "Room 103", "Lab A", "Lab B"]
    
    for i, course in enumerate(courses):
        # Check if timetable entry exists
        existing = await db.timetable.find_one({"course_id": course["id"]})
        if existing:
            continue
            
        day_idx = i % len(days)
        time_slot = time_slots[i % len(time_slots)]
        room = rooms[i % len(rooms)]
        
        tt_doc = {
            "id": f"tt_{uuid.uuid4().hex[:8]}",
            "course_id": course["id"],
            "teacher_id": course.get("teacher_id"),
            "day_of_week": day_idx,
            "start_time": time_slot[0],
            "end_time": time_slot[1],
            "room": room,
            "created_by": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.timetable.insert_one(tt_doc)
        tt_created += 1
    
    print(f"  ✅ Created {tt_created} timetable entries")
    
    # Create exam results for students
    results_created = 0
    exams = await db.exams.find({}).to_list(1000)
    enrollments = await db.enrollments.find({}).to_list(1000)
    
    import random
    
    for exam in exams:
        # Get students enrolled in the course
        course_enrollments = [e for e in enrollments if e["course_id"] == exam["course_id"]]
        
        for enrollment in course_enrollments:
            # Check if result exists
            existing = await db.exam_results.find_one({
                "exam_id": exam["id"],
                "student_id": enrollment["student_id"]
            })
            if existing:
                continue
            
            # Generate random marks (60-100% of max)
            marks = round(random.uniform(0.6, 1.0) * exam["max_marks"], 1)
            
            result_doc = {
                "id": f"exr_{uuid.uuid4().hex[:8]}",
                "exam_id": exam["id"],
                "student_id": enrollment["student_id"],
                "marks_obtained": marks,
                "remarks": "Good performance" if marks > exam["max_marks"] * 0.8 else "Needs improvement",
                "graded_by": "admin",
                "graded_at": datetime.now(timezone.utc).isoformat()
            }
            await db.exam_results.insert_one(result_doc)
            results_created += 1
    
    print(f"  ✅ Created {results_created} exam results")
    
    # Create assignment grades
    grades_created = 0
    assignments = await db.assignments.find({}).to_list(1000)
    
    for assignment in assignments:
        # Get students enrolled in the course
        course_enrollments = [e for e in enrollments if e["course_id"] == assignment["course_id"]]
        
        for enrollment in course_enrollments:
            # Check if grade exists
            existing = await db.grades.find_one({
                "assignment_id": assignment["id"],
                "student_id": enrollment["student_id"]
            })
            if existing:
                continue
            
            marks = round(random.uniform(0.6, 1.0) * assignment["max_score"], 1)
            
            grade_doc = {
                "id": f"grd_{uuid.uuid4().hex[:8]}",
                "assignment_id": assignment["id"],
                "student_id": enrollment["student_id"],
                "marks_obtained": marks,
                "max_marks": assignment["max_score"],
                "feedback": "Well done!" if marks > assignment["max_score"] * 0.8 else "Keep practicing",
                "graded_by": "admin",
                "graded_at": datetime.now(timezone.utc).isoformat()
            }
            await db.grades.insert_one(grade_doc)
            grades_created += 1
    
    print(f"  ✅ Created {grades_created} assignment grades")
    
    client.close()
    print("\n🎉 Academic seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_academic())
