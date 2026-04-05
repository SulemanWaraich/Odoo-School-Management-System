import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Award, BookOpen, TrendingUp, Target } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StudentGrades = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [grades, setGrades] = useState([]);
  const [examResults, setExamResults] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, gradesRes, examRes] = await Promise.all([
        axios.get(`${API_URL}/api/academic-summary`, { withCredentials: true }),
        axios.get(`${API_URL}/api/grades`, { withCredentials: true }),
        axios.get(`${API_URL}/api/exam-results`, { withCredentials: true })
      ]);
      setSummary(summaryRes.data);
      setGrades(gradesRes.data);
      setExamResults(examRes.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-amber-100 text-amber-800';
    if (grade === 'D') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <DashboardLayout title="My Grades">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare chart data
  const courseChartData = summary?.courses.map(c => ({
    name: c.course_code,
    percentage: c.percentage
  })) || [];

  return (
    <DashboardLayout title="My Grades">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overall Percentage</p>
                <p className="text-2xl font-bold text-slate-900">{summary?.overall.percentage || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <Progress value={summary?.overall.percentage || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">GPA</p>
                <p className="text-2xl font-bold text-slate-900">{summary?.overall.gpa || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Grade</p>
                <p className="text-2xl font-bold text-slate-900">{summary?.overall.grade_letter || 'N/A'}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className={`text-2xl font-bold ${summary?.overall.status === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {summary?.overall.status || 'N/A'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${summary?.overall.status === 'Pass' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <Award className={`w-6 h-6 ${summary?.overall.status === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
          <TabsTrigger value="assignments">Assignment Grades</TabsTrigger>
          <TabsTrigger value="exams">Exam Results</TabsTrigger>
        </TabsList>

        {/* Subject Performance */}
        <TabsContent value="subjects">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Subject-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courseChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                        formatter={(value) => [`${value}%`, 'Score']}
                      />
                      <Bar dataKey="percentage" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Course Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summary?.courses.map((course, idx) => (
                    <div key={course.course_id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{course.course_name}</h4>
                          <p className="text-sm text-slate-500">{course.course_code} • {course.teacher_name}</p>
                        </div>
                        <Badge className={getGradeColor(course.grade_letter)}>
                          {course.grade_letter}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Marks: {course.marks_obtained}/{course.marks_max}</span>
                        <span>•</span>
                        <span>{course.percentage}%</span>
                        <span>•</span>
                        <span>Attendance: {course.attendance_percentage}%</span>
                      </div>
                      <Progress value={course.percentage} className="mt-2 h-2" />
                    </div>
                  ))}
                  {(!summary?.courses || summary.courses.length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      No courses enrolled
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assignment Grades */}
        <TabsContent value="assignments">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg">Assignment Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-50">Assignment</TableHead>
                    <TableHead className="bg-slate-50">Course</TableHead>
                    <TableHead className="bg-slate-50">Marks</TableHead>
                    <TableHead className="bg-slate-50">Percentage</TableHead>
                    <TableHead className="bg-slate-50">Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => {
                    const percentage = Math.round((grade.marks_obtained / grade.max_marks) * 100);
                    return (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.assignment?.title || 'N/A'}</TableCell>
                        <TableCell>{grade.course?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className="bg-indigo-100 text-indigo-800">
                            {grade.marks_obtained}/{grade.max_marks}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 40 ? 'C' : 'F')}>
                            {percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm max-w-xs truncate">
                          {grade.feedback || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {grades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No assignment grades yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exam Results */}
        <TabsContent value="exams">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg">Exam Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-50">Exam</TableHead>
                    <TableHead className="bg-slate-50">Type</TableHead>
                    <TableHead className="bg-slate-50">Course</TableHead>
                    <TableHead className="bg-slate-50">Marks</TableHead>
                    <TableHead className="bg-slate-50">Percentage</TableHead>
                    <TableHead className="bg-slate-50">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examResults.map((result) => {
                    const percentage = Math.round((result.marks_obtained / (result.exam?.max_marks || 100)) * 100);
                    return (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.exam?.title || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className="bg-purple-100 text-purple-800 capitalize">
                            {result.exam?.exam_type || 'exam'}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.exam?.course?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className="bg-indigo-100 text-indigo-800">
                            {result.marks_obtained}/{result.exam?.max_marks || 100}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 40 ? 'C' : 'F')}>
                            {percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm max-w-xs truncate">
                          {result.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {examResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No exam results yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentGrades;
