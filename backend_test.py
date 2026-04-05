#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class SchoolManagementAPITester:
    def __init__(self, base_url="https://bc462be7-4001-4dfb-8255-ae63d7a0db8d.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.student_token = None
        self.teacher_token = None
        self.created_resources = {
            'students': [],
            'teachers': [],
            'courses': [],
            'assignments': [],
            'enrollments': [],
            'exams': [],
            'exam_results': [],
            'grades': [],
            'timetable': []
        }
        self.test_course_id = None
        self.test_student_id = None
        self.test_exam_id = None
        self.test_assignment_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200, auth_token=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {}
        
        # Note: Using session cookies for authentication instead of bearer tokens
        # The session already has cookies set from login
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response.json() if success else {}, response.status_code
            
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_admin_login(self):
        """Test admin login"""
        success, response, status = self.make_request(
            'POST', 'auth/login',
            {"email": "admin@school.com", "password": "admin123"}
        )
        
        if success and 'id' in response:
            # Extract token from cookies if available
            cookies = self.session.cookies.get_dict()
            if 'access_token' in cookies:
                self.admin_token = cookies['access_token']
            return self.log_test("Admin Login", True)
        else:
            return self.log_test("Admin Login", False, f"Status: {status}, Response: {response}")

    def test_teacher_login(self):
        """Test teacher login with sarah.johnson@school.com"""
        success, response, status = self.make_request(
            'POST', 'auth/login',
            {"email": "sarah.johnson@school.com", "password": "teacher123"}
        )
        
        if success and 'id' in response:
            # Extract token from cookies if available
            cookies = self.session.cookies.get_dict()
            if 'access_token' in cookies:
                self.teacher_token = cookies['access_token']
            return self.log_test("Teacher Login (Sarah Johnson)", True)
        else:
            return self.log_test("Teacher Login (Sarah Johnson)", False, f"Status: {status}, Response: {response}")

    def test_student_login(self):
        """Test student login with john.smith@school.com"""
        success, response, status = self.make_request(
            'POST', 'auth/login',
            {"email": "john.smith@school.com", "password": "student123"}
        )
        
        if success and 'id' in response:
            # Extract token from cookies if available
            cookies = self.session.cookies.get_dict()
            if 'access_token' in cookies:
                self.student_token = cookies['access_token']
            return self.log_test("Student Login (John Smith)", True)
        else:
            return self.log_test("Student Login (John Smith)", False, f"Status: {status}, Response: {response}")

    def test_admin_stats(self):
        """Test admin dashboard stats"""
        success, response, status = self.make_request(
            'GET', 'stats/admin'
        )
        
        if success and 'total_students' in response:
            return self.log_test("Admin Stats API", True)
        else:
            return self.log_test("Admin Stats API", False, f"Status: {status}")

    def test_teacher_stats(self):
        """Test teacher dashboard stats"""
        success, response, status = self.make_request(
            'GET', 'stats/teacher'
        )
        
        if success and 'total_courses' in response:
            return self.log_test("Teacher Stats API", True)
        else:
            return self.log_test("Teacher Stats API", False, f"Status: {status}")

    def test_student_stats(self):
        """Test student dashboard stats"""
        success, response, status = self.make_request(
            'GET', 'stats/student'
        )
        
        if success and 'total_courses' in response:
            return self.log_test("Student Stats API", True)
        else:
            return self.log_test("Student Stats API", False, f"Status: {status}")

    def test_teacher_courses(self):
        """Test teacher courses endpoint"""
        success, response, status = self.make_request(
            'GET', 'courses'
        )
        
        if success:
            return self.log_test("Teacher Courses API", True)
        else:
            return self.log_test("Teacher Courses API", False, f"Status: {status}")

    def test_student_courses(self):
        """Test student courses endpoint"""
        success, response, status = self.make_request(
            'GET', 'courses'
        )
        
        if success:
            return self.log_test("Student Courses API", True)
        else:
            return self.log_test("Student Courses API", False, f"Status: {status}")

    def test_teacher_attendance(self):
        """Test teacher attendance management"""
        success, response, status = self.make_request(
            'GET', 'attendance'
        )
        
        if success:
            return self.log_test("Teacher Attendance API", True)
        else:
            return self.log_test("Teacher Attendance API", False, f"Status: {status}")

    def test_student_attendance(self):
        """Test student attendance history"""
        success, response, status = self.make_request(
            'GET', 'attendance'
        )
        
        if success:
            return self.log_test("Student Attendance API", True)
        else:
            return self.log_test("Student Attendance API", False, f"Status: {status}")

    def test_teacher_assignments(self):
        """Test teacher assignments management"""
        success, response, status = self.make_request(
            'GET', 'assignments'
        )
        
        if success:
            return self.log_test("Teacher Assignments API", True)
        else:
            return self.log_test("Teacher Assignments API", False, f"Status: {status}")

    def test_student_assignments(self):
        """Test student assignments view"""
        success, response, status = self.make_request(
            'GET', 'assignments'
        )
        
        if success:
            return self.log_test("Student Assignments API", True)
        else:
            return self.log_test("Student Assignments API", False, f"Status: {status}")

    def test_teacher_progress(self):
        """Test teacher progress management"""
        success, response, status = self.make_request(
            'GET', 'progress'
        )
        
        if success:
            return self.log_test("Teacher Progress API", True)
        else:
            return self.log_test("Teacher Progress API", False, f"Status: {status}")

    def test_student_progress(self):
        """Test student progress view"""
        success, response, status = self.make_request(
            'GET', 'progress'
        )
        
        if success:
            return self.log_test("Student Progress API", True)
        else:
            return self.log_test("Student Progress API", False, f"Status: {status}")

    def test_student_announcements(self):
        """Test student announcements view"""
        success, response, status = self.make_request(
            'GET', 'announcements'
        )
        
        if success:
            return self.log_test("Student Announcements API", True)
        else:
            return self.log_test("Student Announcements API", False, f"Status: {status}")

    def test_student_registration(self):
        """Test student registration"""
        student_data = {
            "email": f"student{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "password123",
            "name": "Test Student",
            "role": "student"
        }
        
        success, response, status = self.make_request(
            'POST', 'auth/register', student_data, 200
        )
        
        if success and 'id' in response:
            self.created_resources['students'].append(response['id'])
            return self.log_test("Student Registration", True)
        else:
            return self.log_test("Student Registration", False, f"Status: {status}, Response: {response}")

    def test_teacher_management(self):
        """Test teacher management endpoints"""
        # Get teachers list
        success, response, status = self.make_request(
            'GET', 'teachers'
        )
        
        if success:
            return self.log_test("Get Teachers List", True)
        else:
            return self.log_test("Get Teachers List", False, f"Status: {status}")

    def test_student_management(self):
        """Test student management endpoints"""
        # Get students list
        success, response, status = self.make_request(
            'GET', 'students'
        )
        
        if success:
            return self.log_test("Get Students List", True)
        else:
            return self.log_test("Get Students List", False, f"Status: {status}")

    def test_course_creation(self):
        """Test course creation"""
        course_data = {
            "name": "Test Mathematics",
            "code": f"MATH{datetime.now().strftime('%H%M%S')}",
            "description": "Test mathematics course",
            "grade": "Grade 10",
            "teacher_id": None
        }
        
        success, response, status = self.make_request(
            'POST', 'courses', course_data, 200
        )
        
        if success and 'id' in response:
            self.created_resources['courses'].append(response['id'])
            return self.log_test("Course Creation", True)
        else:
            return self.log_test("Course Creation", False, f"Status: {status}, Response: {response}")

    def test_courses_list(self):
        """Test getting courses list"""
        success, response, status = self.make_request(
            'GET', 'courses'
        )
        
        if success:
            return self.log_test("Get Courses List", True)
        else:
            return self.log_test("Get Courses List", False, f"Status: {status}")

    def test_attendance_endpoints(self):
        """Test attendance management"""
        success, response, status = self.make_request(
            'GET', 'attendance'
        )
        
        if success:
            return self.log_test("Get Attendance Records", True)
        else:
            return self.log_test("Get Attendance Records", False, f"Status: {status}")

    def test_assignments_endpoints(self):
        """Test assignment management"""
        success, response, status = self.make_request(
            'GET', 'assignments'
        )
        
        if success:
            return self.log_test("Get Assignments List", True)
        else:
            return self.log_test("Get Assignments List", False, f"Status: {status}")

    def test_progress_endpoints(self):
        """Test progress tracking"""
        success, response, status = self.make_request(
            'GET', 'progress'
        )
        
        if success:
            return self.log_test("Get Progress Records", True)
        else:
            return self.log_test("Get Progress Records", False, f"Status: {status}")

    def test_announcements_endpoints(self):
        """Test announcements management"""
        # Get announcements
        success, response, status = self.make_request(
            'GET', 'announcements'
        )
        
        if success:
            return self.log_test("Get Announcements", True)
        else:
            return self.log_test("Get Announcements", False, f"Status: {status}")

    def test_announcement_creation(self):
        """Test creating announcements"""
        announcement_data = {
            "title": "Test Announcement",
            "content": "This is a test announcement",
            "target_role": "all"
        }
        
        success, response, status = self.make_request(
            'POST', 'announcements', announcement_data, 200
        )
        
        if success and 'id' in response:
            return self.log_test("Create Announcement", True)
        else:
            return self.log_test("Create Announcement", False, f"Status: {status}, Response: {response}")

    def test_auth_me_endpoint(self):
        """Test getting current user info"""
        success, response, status = self.make_request(
            'GET', 'auth/me'
        )
        
        if success and 'email' in response:
            return self.log_test("Get Current User Info", True)
        else:
            return self.log_test("Get Current User Info", False, f"Status: {status}")

    def test_logout(self):
        """Test logout functionality"""
        success, response, status = self.make_request(
            'POST', 'auth/logout'
        )
        
        if success:
            return self.log_test("Admin Logout", True)
        else:
            return self.log_test("Admin Logout", False, f"Status: {status}")

    # ============ NEW GRADING/EXAM MODULE TESTS ============
    
    def setup_test_data(self):
        """Setup test data for grading and exam tests"""
        # Get existing courses and students
        success, courses_response, _ = self.make_request('GET', 'courses')
        if success and courses_response:
            self.test_course_id = courses_response[0]['id'] if courses_response else None
        
        success, students_response, _ = self.make_request('GET', 'students')
        if success and students_response:
            self.test_student_id = students_response[0]['id'] if students_response else None
        
        # Get existing assignments
        success, assignments_response, _ = self.make_request('GET', 'assignments')
        if success and assignments_response:
            self.test_assignment_id = assignments_response[0]['id'] if assignments_response else None

    def test_exams_list(self):
        """Test GET /api/exams - List all exams"""
        success, response, status = self.make_request(
            'GET', 'exams'
        )
        
        if success:
            return self.log_test("GET /api/exams - List all exams", True)
        else:
            return self.log_test("GET /api/exams - List all exams", False, f"Status: {status}")

    def test_exam_creation(self):
        """Test POST /api/exams - Create exam"""
        if not self.test_course_id:
            return self.log_test("POST /api/exams - Create exam", False, "No test course available")
        
        exam_data = {
            "course_id": self.test_course_id,
            "title": "Test Midterm Exam",
            "exam_type": "midterm",
            "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "max_marks": 100,
            "description": "Test exam for API testing"
        }
        
        success, response, status = self.make_request(
            'POST', 'exams', exam_data, 200
        )
        
        if success and 'id' in response:
            self.test_exam_id = response['id']
            self.created_resources['exams'].append(response['id'])
            return self.log_test("POST /api/exams - Create exam", True)
        else:
            return self.log_test("POST /api/exams - Create exam", False, f"Status: {status}, Response: {response}")

    def test_exam_update(self):
        """Test PUT /api/exams/{exam_id} - Update exam"""
        if not self.test_exam_id:
            return self.log_test("PUT /api/exams/{exam_id} - Update exam", False, "No test exam available")
        
        update_data = {
            "title": "Updated Test Midterm Exam",
            "max_marks": 120
        }
        
        success, response, status = self.make_request(
            'PUT', f'exams/{self.test_exam_id}', update_data, 200
        )
        
        if success:
            return self.log_test("PUT /api/exams/{exam_id} - Update exam", True)
        else:
            return self.log_test("PUT /api/exams/{exam_id} - Update exam", False, f"Status: {status}")

    def test_exam_results_list(self):
        """Test GET /api/exam-results - Get exam results"""
        success, response, status = self.make_request(
            'GET', 'exam-results'
        )
        
        if success:
            return self.log_test("GET /api/exam-results - Get exam results", True)
        else:
            return self.log_test("GET /api/exam-results - Get exam results", False, f"Status: {status}")

    def test_exam_result_creation(self):
        """Test POST /api/exam-results - Create exam result"""
        if not self.test_exam_id or not self.test_student_id:
            return self.log_test("POST /api/exam-results - Create exam result", False, "Missing test data")
        
        result_data = {
            "exam_id": self.test_exam_id,
            "student_id": self.test_student_id,
            "marks_obtained": 85.5,
            "remarks": "Good performance in the test exam"
        }
        
        success, response, status = self.make_request(
            'POST', 'exam-results', result_data, 200
        )
        
        if success and 'id' in response:
            self.created_resources['exam_results'].append(response['id'])
            return self.log_test("POST /api/exam-results - Create exam result", True)
        else:
            return self.log_test("POST /api/exam-results - Create exam result", False, f"Status: {status}, Response: {response}")

    def test_exam_results_bulk(self):
        """Test POST /api/exam-results/bulk - Bulk create exam results"""
        if not self.test_exam_id or not self.test_student_id:
            return self.log_test("POST /api/exam-results/bulk - Bulk create exam results", False, "Missing test data")
        
        bulk_data = {
            "exam_id": self.test_exam_id,
            "results": [
                {
                    "student_id": self.test_student_id,
                    "marks_obtained": 92.0,
                    "remarks": "Excellent work"
                }
            ]
        }
        
        success, response, status = self.make_request(
            'POST', 'exam-results/bulk', bulk_data, 200
        )
        
        if success:
            return self.log_test("POST /api/exam-results/bulk - Bulk create exam results", True)
        else:
            return self.log_test("POST /api/exam-results/bulk - Bulk create exam results", False, f"Status: {status}")

    def test_grades_list(self):
        """Test GET /api/grades - Get assignment grades"""
        success, response, status = self.make_request(
            'GET', 'grades'
        )
        
        if success:
            return self.log_test("GET /api/grades - Get assignment grades", True)
        else:
            return self.log_test("GET /api/grades - Get assignment grades", False, f"Status: {status}")

    def test_grades_bulk(self):
        """Test POST /api/grades/bulk - Bulk create grades"""
        if not self.test_assignment_id or not self.test_student_id:
            return self.log_test("POST /api/grades/bulk - Bulk create grades", False, "Missing test data")
        
        bulk_data = {
            "assignment_id": self.test_assignment_id,
            "grades": [
                {
                    "student_id": self.test_student_id,
                    "marks_obtained": 88.0,
                    "feedback": "Great work on this assignment!"
                }
            ]
        }
        
        success, response, status = self.make_request(
            'POST', 'grades/bulk', bulk_data, 200
        )
        
        if success:
            return self.log_test("POST /api/grades/bulk - Bulk create grades", True)
        else:
            return self.log_test("POST /api/grades/bulk - Bulk create grades", False, f"Status: {status}")

    def test_gradebook(self):
        """Test GET /api/gradebook/{course_id} - Get gradebook for course"""
        if not self.test_course_id:
            return self.log_test("GET /api/gradebook/{course_id} - Get gradebook for course", False, "No test course available")
        
        success, response, status = self.make_request(
            'GET', f'gradebook/{self.test_course_id}'
        )
        
        if success:
            return self.log_test("GET /api/gradebook/{course_id} - Get gradebook for course", True)
        else:
            return self.log_test("GET /api/gradebook/{course_id} - Get gradebook for course", False, f"Status: {status}")

    def test_academic_summary(self):
        """Test GET /api/academic-summary - Get student academic summary"""
        success, response, status = self.make_request(
            'GET', 'academic-summary'
        )
        
        if success:
            return self.log_test("GET /api/academic-summary - Get student academic summary", True)
        else:
            return self.log_test("GET /api/academic-summary - Get student academic summary", False, f"Status: {status}")

    # ============ TIMETABLE MODULE TESTS ============

    def test_timetable_list(self):
        """Test GET /api/timetable - Get timetable entries"""
        success, response, status = self.make_request(
            'GET', 'timetable'
        )
        
        if success:
            return self.log_test("GET /api/timetable - Get timetable entries", True)
        else:
            return self.log_test("GET /api/timetable - Get timetable entries", False, f"Status: {status}")

    def test_timetable_creation(self):
        """Test POST /api/timetable - Create timetable entry"""
        if not self.test_course_id:
            return self.log_test("POST /api/timetable - Create timetable entry", False, "No test course available")
        
        timetable_data = {
            "course_id": self.test_course_id,
            "day_of_week": 1,  # Tuesday
            "start_time": "10:00",
            "end_time": "11:00",
            "room": "Room 201"
        }
        
        success, response, status = self.make_request(
            'POST', 'timetable', timetable_data, 200
        )
        
        if success and 'id' in response:
            self.created_resources['timetable'].append(response['id'])
            return self.log_test("POST /api/timetable - Create timetable entry", True)
        else:
            return self.log_test("POST /api/timetable - Create timetable entry", False, f"Status: {status}, Response: {response}")

    def test_timetable_weekly(self):
        """Test GET /api/timetable/weekly - Get weekly timetable"""
        success, response, status = self.make_request(
            'GET', 'timetable/weekly'
        )
        
        if success:
            return self.log_test("GET /api/timetable/weekly - Get weekly timetable", True)
        else:
            return self.log_test("GET /api/timetable/weekly - Get weekly timetable", False, f"Status: {status}")

    def test_timetable_conflicts(self):
        """Test GET /api/timetable/conflicts - Check for conflicts"""
        success, response, status = self.make_request(
            'GET', 'timetable/conflicts'
        )
        
        if success:
            return self.log_test("GET /api/timetable/conflicts - Check for conflicts", True)
        else:
            return self.log_test("GET /api/timetable/conflicts - Check for conflicts", False, f"Status: {status}")

    def test_performance_overview(self):
        """Test GET /api/performance/overview - Admin view of all performance"""
        success, response, status = self.make_request(
            'GET', 'performance/overview'
        )
        
        if success:
            return self.log_test("GET /api/performance/overview - Admin view of all performance", True)
        else:
            return self.log_test("GET /api/performance/overview - Admin view of all performance", False, f"Status: {status}")

    def test_report_card(self):
        """Test GET /api/report-card/{student_id} - Generate report card"""
        if not self.test_student_id:
            return self.log_test("GET /api/report-card/{student_id} - Generate report card", False, "No test student available")
        
        success, response, status = self.make_request(
            'GET', f'report-card/{self.test_student_id}'
        )
        
        if success:
            return self.log_test("GET /api/report-card/{student_id} - Generate report card", True)
        else:
            return self.log_test("GET /api/report-card/{student_id} - Generate report card", False, f"Status: {status}")

    # ============ ROLE-BASED ACCESS TESTS ============

    def test_teacher_exam_access(self):
        """Test teacher access to exam APIs"""
        success, response, status = self.make_request(
            'GET', 'exams'
        )
        
        if success:
            return self.log_test("Teacher access to exams API", True)
        else:
            return self.log_test("Teacher access to exams API", False, f"Status: {status}")

    def test_student_exam_results_access(self):
        """Test student access to their exam results"""
        success, response, status = self.make_request(
            'GET', 'exam-results'
        )
        
        if success:
            return self.log_test("Student access to exam results API", True)
        else:
            return self.log_test("Student access to exam results API", False, f"Status: {status}")

    def test_student_academic_summary_access(self):
        """Test student access to their academic summary"""
        success, response, status = self.make_request(
            'GET', 'academic-summary'
        )
        
        if success:
            return self.log_test("Student access to academic summary API", True)
        else:
            return self.log_test("Student access to academic summary API", False, f"Status: {status}")

    def test_student_timetable_access(self):
        """Test student access to timetable"""
        success, response, status = self.make_request(
            'GET', 'timetable'
        )
        
        if success:
            return self.log_test("Student access to timetable API", True)
        else:
            return self.log_test("Student access to timetable API", False, f"Status: {status}")

    def test_exam_deletion(self):
        """Test DELETE /api/exams/{exam_id} - Delete exam"""
        if not self.test_exam_id:
            return self.log_test("DELETE /api/exams/{exam_id} - Delete exam", False, "No test exam available")
        
        success, response, status = self.make_request(
            'DELETE', f'exams/{self.test_exam_id}'
        )
        
        if success:
            return self.log_test("DELETE /api/exams/{exam_id} - Delete exam", True)
        else:
            return self.log_test("DELETE /api/exams/{exam_id} - Delete exam", False, f"Status: {status}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting School Management System Backend API Tests")
        print("=" * 60)
        
        # Authentication tests
        print("\n📋 Authentication Tests:")
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping admin tests")
        else:
            self.test_auth_me_endpoint()
        
        # Teacher authentication and workflow tests
        print("\n👩‍🏫 Teacher Workflow Tests:")
        if not self.test_teacher_login():
            print("❌ Teacher login failed - stopping teacher tests")
        else:
            self.test_teacher_stats()
            self.test_teacher_courses()
            self.test_teacher_attendance()
            self.test_teacher_assignments()
            self.test_teacher_progress()
        
        # Student authentication and workflow tests
        print("\n🎓 Student Workflow Tests:")
        if not self.test_student_login():
            print("❌ Student login failed - stopping student tests")
        else:
            self.test_student_stats()
            self.test_student_courses()
            self.test_student_attendance()
            self.test_student_assignments()
            self.test_student_progress()
            self.test_student_announcements()
        
        # Admin functionality tests (if admin login worked)
        if self.admin_token:
            print("\n📊 Admin Dashboard Tests:")
            self.test_admin_stats()
            
            # Setup test data for new module tests
            print("\n🔧 Setting up test data...")
            self.setup_test_data()
            
            # Management endpoints tests
            print("\n👥 Management Endpoints Tests:")
            self.test_student_management()
            self.test_teacher_management()
            self.test_courses_list()
            self.test_course_creation()
            self.test_attendance_endpoints()
            self.test_assignments_endpoints()
            self.test_progress_endpoints()
            self.test_announcements_endpoints()
            self.test_announcement_creation()
            
            # NEW GRADING/EXAM MODULE TESTS
            print("\n📝 Grading/Exam Module Tests:")
            self.test_exams_list()
            self.test_exam_creation()
            self.test_exam_update()
            self.test_exam_results_list()
            self.test_exam_result_creation()
            self.test_exam_results_bulk()
            self.test_grades_list()
            self.test_grades_bulk()
            self.test_gradebook()
            self.test_academic_summary()
            self.test_performance_overview()
            
            # NEW TIMETABLE MODULE TESTS
            print("\n📅 Timetable Module Tests:")
            self.test_timetable_list()
            self.test_timetable_creation()
            self.test_timetable_weekly()
            self.test_timetable_conflicts()
            
            # NEW REPORT CARD MODULE TESTS
            print("\n📋 Report Card Module Tests:")
            self.test_report_card()
            
            # User registration tests
            print("\n🎓 User Registration Tests:")
            self.test_student_registration()
        
        # Role-based access tests
        if self.teacher_token and self.student_token:
            print("\n🔐 Role-based Access Tests:")
            self.test_teacher_exam_access()
            self.test_student_exam_results_access()
            self.test_student_academic_summary_access()
            self.test_student_timetable_access()
        
        # Cleanup tests
        if self.admin_token:
            print("\n🧹 Cleanup Tests:")
            self.test_exam_deletion()
            
            # Logout test
            print("\n🚪 Logout Tests:")
            self.test_logout()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = SchoolManagementAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())