import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StudentProgress = () => {
  const [progress, setProgress] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchProgress();
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`, { withCredentials: true });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const params = selectedCourse ? `?course_id=${selectedCourse}` : '';
      const response = await axios.get(`${API_URL}/api/progress${params}`, { withCredentials: true });
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.name || 'Unknown';
  };

  const getScoreColor = (score) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (!score) return 'bg-slate-100';
    if (score >= 80) return 'bg-emerald-50';
    if (score >= 60) return 'bg-amber-50';
    return 'bg-red-50';
  };

  // Prepare chart data
  const chartData = [...progress]
    .filter(p => p.performance_score)
    .sort((a, b) => new Date(a.week_start) - new Date(b.week_start))
    .slice(-8)
    .map(p => ({
      week: p.week_start.substring(5),
      score: p.performance_score
    }));

  // Calculate average score
  const avgScore = progress.length > 0 
    ? Math.round(progress.filter(p => p.performance_score).reduce((sum, p) => sum + p.performance_score, 0) / progress.filter(p => p.performance_score).length) 
    : 0;

  return (
    <DashboardLayout title="My Progress">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Records</p>
                <p className="text-3xl font-semibold text-slate-900" style={{ fontFamily: 'Work Sans' }}>
                  {progress.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Score</p>
                <p className={`text-3xl font-semibold ${getScoreColor(avgScore)}`} style={{ fontFamily: 'Work Sans' }}>
                  {avgScore || '-'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${getScoreBg(avgScore)} flex items-center justify-center`}>
                <TrendingUp className={`w-6 h-6 ${getScoreColor(avgScore)}`} strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Filter by Course</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourse || "all"} onValueChange={(value) => setSelectedCourse(value === "all" ? "" : value)}>
              <SelectTrigger data-testid="progress-course-filter">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <Card className="dashboard-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
              Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4F46E5" 
                    strokeWidth={2}
                    dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Records */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            Weekly Progress History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : progress.length > 0 ? (
            <div className="space-y-4">
              {progress.map((record) => (
                <div 
                  key={record.id} 
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors"
                  data-testid={`progress-record-${record.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-slate-500">Week of {record.week_start}</p>
                      <p className="font-medium text-slate-900">{getCourseName(record.course_id)}</p>
                    </div>
                    {record.performance_score && (
                      <div className={`px-3 py-1 rounded-lg ${getScoreBg(record.performance_score)} flex items-center gap-2`}>
                        <TrendingUp className={`w-4 h-4 ${getScoreColor(record.performance_score)}`} />
                        <span className={`font-semibold ${getScoreColor(record.performance_score)}`}>
                          {record.performance_score}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{record.remarks}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-slate-500">No progress records yet</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentProgress;
