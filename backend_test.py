#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class SchoolManagementAPITester:
    def __init__(self, base_url="https://class-nexus-3.preview.emergentagent.com"):
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
            'enrollments': []
        }

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
        
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'
        
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

    def test_admin_stats(self):
        """Test admin dashboard stats"""
        success, response, status = self.make_request(
            'GET', 'stats/admin', auth_token=self.admin_token
        )
        
        if success and 'total_students' in response:
            return self.log_test("Admin Stats API", True)
        else:
            return self.log_test("Admin Stats API", False, f"Status: {status}")

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
            'GET', 'teachers', auth_token=self.admin_token
        )
        
        if success:
            return self.log_test("Get Teachers List", True)
        else:
            return self.log_test("Get Teachers List", False, f"Status: {status}")

    def test_student_management(self):
        """Test student management endpoints"""
        # Get students list
        success, response, status = self.make_request(
            'GET', 'students', auth_token=self.admin_token
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
            'POST', 'courses', course_data, 200, self.admin_token
        )
        
        if success and 'id' in response:
            self.created_resources['courses'].append(response['id'])
            return self.log_test("Course Creation", True)
        else:
            return self.log_test("Course Creation", False, f"Status: {status}, Response: {response}")

    def test_courses_list(self):
        """Test getting courses list"""
        success, response, status = self.make_request(
            'GET', 'courses', auth_token=self.admin_token
        )
        
        if success:
            return self.log_test("Get Courses List", True)
        else:
            return self.log_test("Get Courses List", False, f"Status: {status}")

    def test_attendance_endpoints(self):
        """Test attendance management"""
        success, response, status = self.make_request(
            'GET', 'attendance', auth_token=self.admin_token
        )
        
        if success:
            return self.log_test("Get Attendance Records", True)
        else:
            return self.log_test("Get Attendance Records", False, f"Status: {status}")

    def test_assignments_endpoints(self):
        """Test assignment management"""
        success, response, status = self.make_request(
            'GET', 'assignments', auth_token=self.admin_token
        )
        
        if success:
            return self.log_test("Get Assignments List", True)
        else:
            return self.log_test("Get Assignments List", False, f"Status: {status}")

    def test_progress_endpoints(self):
        """Test progress tracking"""
        success, response, status = self.make_request(
            'GET', 'progress', auth_token=self.admin_token
        )
        
        if success:
            return self.log_test("Get Progress Records", True)
        else:
            return self.log_test("Get Progress Records", False, f"Status: {status}")

    def test_announcements_endpoints(self):
        """Test announcements management"""
        # Get announcements
        success, response, status = self.make_request(
            'GET', 'announcements', auth_token=self.admin_token
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
            'POST', 'announcements', announcement_data, 200, self.admin_token
        )
        
        if success and 'id' in response:
            return self.log_test("Create Announcement", True)
        else:
            return self.log_test("Create Announcement", False, f"Status: {status}, Response: {response}")

    def test_auth_me_endpoint(self):
        """Test getting current user info"""
        success, response, status = self.make_request(
            'GET', 'auth/me', auth_token=self.admin_token
        )
        
        if success and 'email' in response:
            return self.log_test("Get Current User Info", True)
        else:
            return self.log_test("Get Current User Info", False, f"Status: {status}")

    def test_logout(self):
        """Test logout functionality"""
        success, response, status = self.make_request(
            'POST', 'auth/logout', auth_token=self.admin_token
        )
        
        if success:
            return self.log_test("Admin Logout", True)
        else:
            return self.log_test("Admin Logout", False, f"Status: {status}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting School Management System Backend API Tests")
        print("=" * 60)
        
        # Authentication tests
        print("\n📋 Authentication Tests:")
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
        
        self.test_auth_me_endpoint()
        
        # Admin functionality tests
        print("\n📊 Admin Dashboard Tests:")
        self.test_admin_stats()
        
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
        
        # User registration tests
        print("\n🎓 User Registration Tests:")
        self.test_student_registration()
        
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