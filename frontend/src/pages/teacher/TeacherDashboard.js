import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BookOpen, Users, FileText, ClipboardCheck, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats/teacher`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'My Courses', value: stats?.total_courses || 0, icon: BookOpen, color: 'bg-indigo-50 text-indigo-600' },
    { title: 'Total Students', value: stats?.total_students || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { title: 'Active Assignments', value: stats?.active_assignments || 0, icon: FileText, color: 'bg-green-50 text-green-600' },
    { title: 'Pending Submissions', value: stats?.pending_submissions || 0, icon: ClipboardCheck, color: 'bg-amber-50 text-amber-600' },
  ];

  const courseData = stats?.courses?.map((course, idx) => ({
    name: course.name?.substring(0, 15) || `Course ${idx + 1}`,
    students: Math.floor(Math.random() * 30) + 10, // Placeholder
  })) || [];

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="teacher-stats-grid">
        {statCards.map((stat, index) => (
          <Card key={index} className="dashboard-card" data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-semibold text-slate-900" style={{ fontFamily: 'Work Sans' }}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Courses Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
              My Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.courses?.length > 0 ? (
              <div className="space-y-4">
                {stats.courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{course.name}</p>
                      <p className="text-sm text-slate-500">{course.code} • {course.grade}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No courses assigned yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
              Students per Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {courseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="students" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No course data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card className="dashboard-card mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/teacher/attendance" className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-emerald-900">Mark Attendance</p>
                <p className="text-sm text-emerald-600">Today: {stats?.today_attendance_count || 0} marked</p>
              </div>
            </a>
            <a href="/teacher/assignments" className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-blue-900">Create Assignment</p>
                <p className="text-sm text-blue-600">{stats?.active_assignments || 0} active</p>
              </div>
            </a>
            <a href="/teacher/progress" className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-purple-900">Update Progress</p>
                <p className="text-sm text-purple-600">Weekly reports</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
