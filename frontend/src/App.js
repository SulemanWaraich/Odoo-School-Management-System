import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import CourseManagement from './pages/admin/CourseManagement';
import AttendanceOverview from './pages/admin/AttendanceOverview';
import AssignmentOverview from './pages/admin/AssignmentOverview';
import ProgressOverview from './pages/admin/ProgressOverview';
import AnnouncementManagement from './pages/admin/AnnouncementManagement';
import UserManagement from './pages/admin/UserManagement';
import SetupWizard from './pages/admin/SetupWizard';
import Reports from './pages/admin/Reports';
import GradesManagement from './pages/admin/GradesManagement';
import TimetableManagement from './pages/admin/TimetableManagement';
import ReportCards from './pages/admin/ReportCards';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherProgress from './pages/teacher/TeacherProgress';
import TeacherGradebook from './pages/teacher/TeacherGradebook';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import TeacherReportCards from './pages/teacher/TeacherReportCards';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourses from './pages/student/StudentCourses';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentProgress from './pages/student/StudentProgress';
import StudentGrades from './pages/student/StudentGrades';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentReportCard from './pages/student/StudentReportCard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardRoutes = {
      admin: '/admin',
      teacher: '/teacher',
      student: '/student'
    };
    return <Navigate to={dashboardRoutes[user.role] || '/login'} replace />;
  }

  return children;
};

const AppRouter = () => {
  const location = useLocation();
  
  // Check for OAuth callback synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/students" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <StudentManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/teachers" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <TeacherManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/courses" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <CourseManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/attendance" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AttendanceOverview />
        </ProtectedRoute>
      } />
      <Route path="/admin/assignments" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AssignmentOverview />
        </ProtectedRoute>
      } />
      <Route path="/admin/progress" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ProgressOverview />
        </ProtectedRoute>
      } />
      <Route path="/admin/announcements" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AnnouncementManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <UserManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/setup" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <SetupWizard />
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/admin/grades" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <GradesManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/timetable" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <TimetableManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/report-cards" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ReportCards />
        </ProtectedRoute>
      } />

      {/* Teacher routes */}
      <Route path="/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherDashboard />
        </ProtectedRoute>
      } />
      <Route path="/teacher/courses" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherCourses />
        </ProtectedRoute>
      } />
      <Route path="/teacher/attendance" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherAttendance />
        </ProtectedRoute>
      } />
      <Route path="/teacher/assignments" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherAssignments />
        </ProtectedRoute>
      } />
      <Route path="/teacher/gradebook" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherGradebook />
        </ProtectedRoute>
      } />
      <Route path="/teacher/timetable" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherTimetable />
        </ProtectedRoute>
      } />
      <Route path="/teacher/report-cards" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherReportCards />
        </ProtectedRoute>
      } />
      <Route path="/teacher/progress" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherProgress />
        </ProtectedRoute>
      } />

      {/* Student routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/courses" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentCourses />
        </ProtectedRoute>
      } />
      <Route path="/student/attendance" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentAttendance />
        </ProtectedRoute>
      } />
      <Route path="/student/assignments" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentAssignments />
        </ProtectedRoute>
      } />
      <Route path="/student/grades" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentGrades />
        </ProtectedRoute>
      } />
      <Route path="/student/timetable" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentTimetable />
        </ProtectedRoute>
      } />
      <Route path="/student/report-card" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentReportCard />
        </ProtectedRoute>
      } />
      <Route path="/student/progress" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentProgress />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
