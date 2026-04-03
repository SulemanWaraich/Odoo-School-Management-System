import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BookOpen, ClipboardCheck, FileText, TrendingUp, Megaphone } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAnnouncements();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats/student`, { withCredentials: true });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/announcements`, { withCredentials: true });
      setAnnouncements(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const statCards = [
    { title: 'Enrolled Courses', value: stats?.total_courses || 0, icon: BookOpen, color: 'bg-indigo-50 text-indigo-600' },
    { title: 'Attendance', value: `${stats?.attendance_percentage || 0}%`, icon: ClipboardCheck, color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Pending Assignments', value: stats?.pending_assignments || 0, icon: FileText, color: 'bg-amber-50 text-amber-600' },
  ];

  const attendanceData = [
    { name: 'Present', value: stats?.attendance_percentage || 0, color: '#10B981' },
    { name: 'Absent', value: 100 - (stats?.attendance_percentage || 0), color: '#E2E8F0' },
  ];

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
    <DashboardLayout title="Student Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-testid="student-stats-grid">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Chart */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center">
              <p className="text-3xl font-semibold text-emerald-600" style={{ fontFamily: 'Work Sans' }}>
                {stats?.attendance_percentage || 0}%
              </p>
              <p className="text-sm text-slate-500">Overall Attendance</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Progress */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
              Recent Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_progress?.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_progress.map((progress, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-500">Week of {progress.week_start}</p>
                      <p className="text-sm text-slate-700 mt-1 line-clamp-1">{progress.remarks}</p>
                    </div>
                    {progress.performance_score && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-4 h-4 ${progress.performance_score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span className={`font-semibold ${progress.performance_score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {progress.performance_score}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-slate-500">No progress records yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            Recent Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{announcement.title}</p>
                    <p className="text-sm text-slate-500 mt-1">{format(new Date(announcement.created_at), 'PPP')}</p>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{announcement.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-slate-500">No announcements</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentDashboard;
