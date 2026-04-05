import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { 
  ClipboardCheck, FileText, TrendingUp, Users, Download, 
  CalendarIcon, BarChart3, PieChart 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart, Line
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Reports = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  
  // Report Data
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [assignmentReport, setAssignmentReport] = useState(null);
  const [progressReport, setProgressReport] = useState(null);
  const [classSummary, setClassSummary] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState(null);

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendanceReport();
    if (activeTab === 'assignments') fetchAssignmentReport();
    if (activeTab === 'progress') fetchProgressReport();
  }, [activeTab, selectedCourse, startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'class' && selectedCourse) fetchClassSummary();
  }, [activeTab, selectedCourse]);

  useEffect(() => {
    if (activeTab === 'student' && selectedStudent) fetchStudentPerformance();
  }, [activeTab, selectedStudent]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAttendanceReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourse) params.append('course_id', selectedCourse);
      params.append('start_date', format(startDate, 'yyyy-MM-dd'));
      params.append('end_date', format(endDate, 'yyyy-MM-dd'));
      
      const response = await axios.get(`${API_URL}/api/reports/attendance?${params.toString()}`);
      setAttendanceReport(response.data);
    } catch (error) {
      console.error('Error fetching attendance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentReport = async () => {
    setLoading(true);
    try {
      const params = selectedCourse ? `?course_id=${selectedCourse}` : '';
      const response = await axios.get(`${API_URL}/api/reports/assignments${params}`);
      setAssignmentReport(response.data);
    } catch (error) {
      console.error('Error fetching assignment report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressReport = async () => {
    setLoading(true);
    try {
      const params = selectedCourse ? `?course_id=${selectedCourse}` : '';
      const response = await axios.get(`${API_URL}/api/reports/progress${params}`);
      setProgressReport(response.data);
    } catch (error) {
      console.error('Error fetching progress report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/reports/class-summary?course_id=${selectedCourse}`);
      setClassSummary(response.data);
    } catch (error) {
      console.error('Error fetching class summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentPerformance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/reports/student-performance/${selectedStudent}`);
      setStudentPerformance(response.data);
    } catch (error) {
      console.error('Error fetching student performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType) => {
    try {
      const params = selectedCourse ? `?course_id=${selectedCourse}&format=csv` : '?format=csv';
      const response = await axios.get(`${API_URL}/api/reports/export/${reportType}${params}`, { 
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

  const attendancePieData = attendanceReport ? [
    { name: 'Present', value: attendanceReport.summary.present, color: '#10B981' },
    { name: 'Absent', value: attendanceReport.summary.absent, color: '#EF4444' },
    { name: 'Late', value: attendanceReport.summary.late, color: '#F59E0B' },
    { name: 'Excused', value: attendanceReport.summary.excused, color: '#3B82F6' },
  ].filter(d => d.value > 0) : [];

  return (
    <DashboardLayout title="Reports & Analytics">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="class" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Class Summary
          </TabsTrigger>
          <TabsTrigger value="student" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Student Performance
          </TabsTrigger>
        </TabsList>

        {/* Attendance Report */}
        <TabsContent value="attendance">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                  Attendance Report
                </CardTitle>
                <CardDescription>View attendance statistics and trends</CardDescription>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <Select value={selectedCourse || "all"} onValueChange={(v) => setSelectedCourse(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(startDate, 'PP')} - {format(endDate, 'PP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Start Date</Label>
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                      </div>
                      <div>
                        <Label className="text-xs">End Date</Label>
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="outline" onClick={() => exportReport('attendance')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : attendanceReport && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <Card className="bg-slate-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-500 uppercase">Total Records</p>
                        <p className="text-2xl font-semibold">{attendanceReport.summary.total_records}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-emerald-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-emerald-600 uppercase">Present</p>
                        <p className="text-2xl font-semibold text-emerald-600">{attendanceReport.summary.present}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-red-600 uppercase">Absent</p>
                        <p className="text-2xl font-semibold text-red-600">{attendanceReport.summary.absent}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-amber-600 uppercase">Late</p>
                        <p className="text-2xl font-semibold text-amber-600">{attendanceReport.summary.late}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-blue-600 uppercase">Excused</p>
                        <p className="text-2xl font-semibold text-blue-600">{attendanceReport.summary.excused}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Pie Chart */}
                    <Card className="bg-slate-50">
                      <CardHeader>
                        <CardTitle className="text-sm">Attendance Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie
                                data={attendancePieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                              >
                                {attendancePieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </RechartsPie>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Attendance Rate */}
                    <Card className="bg-slate-50">
                      <CardHeader>
                        <CardTitle className="text-sm">Attendance Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center h-64">
                          <p className="text-6xl font-bold text-indigo-600">
                            {attendanceReport.summary.total_records > 0 
                              ? Math.round((attendanceReport.summary.present / attendanceReport.summary.total_records) * 100)
                              : 0}%
                          </p>
                          <p className="text-slate-500 mt-2">Overall Attendance Rate</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Records Table */}
                  <div className="table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-slate-50">Date</TableHead>
                          <TableHead className="bg-slate-50">Student</TableHead>
                          <TableHead className="bg-slate-50">Course</TableHead>
                          <TableHead className="bg-slate-50">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceReport.records.slice(0, 20).map((record, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{record.student_name}</TableCell>
                            <TableCell>{record.course_name}</TableCell>
                            <TableCell>
                              <Badge className={
                                record.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                                record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                record.status === 'late' ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'
                              }>
                                {record.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {attendanceReport.records.length > 20 && (
                      <p className="text-sm text-slate-500 text-center py-2">
                        Showing 20 of {attendanceReport.records.length} records. Export to see all.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Report */}
        <TabsContent value="assignments">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Assignment Report
                </CardTitle>
                <CardDescription>Track assignment completion and submissions</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedCourse || "all"} onValueChange={(v) => setSelectedCourse(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => exportReport('assignments')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : assignmentReport && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-slate-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-500 uppercase">Total Assignments</p>
                        <p className="text-2xl font-semibold">{assignmentReport.summary.total_assignments}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-emerald-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-emerald-600 uppercase">Total Submissions</p>
                        <p className="text-2xl font-semibold text-emerald-600">{assignmentReport.summary.total_submissions}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-indigo-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-indigo-600 uppercase">Avg Submission Rate</p>
                        <p className="text-2xl font-semibold text-indigo-600">{assignmentReport.summary.avg_submission_rate}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chart */}
                  {assignmentReport.assignments.length > 0 && (
                    <Card className="bg-slate-50 mb-6">
                      <CardHeader>
                        <CardTitle className="text-sm">Submission Rates by Assignment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assignmentReport.assignments}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="title" fontSize={12} />
                              <YAxis domain={[0, 100]} fontSize={12} />
                              <Tooltip />
                              <Bar dataKey="submission_rate" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Table */}
                  <div className="table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-slate-50">Assignment</TableHead>
                          <TableHead className="bg-slate-50">Course</TableHead>
                          <TableHead className="bg-slate-50">Due Date</TableHead>
                          <TableHead className="bg-slate-50">Students</TableHead>
                          <TableHead className="bg-slate-50">Submitted</TableHead>
                          <TableHead className="bg-slate-50">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignmentReport.assignments.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.title}</TableCell>
                            <TableCell>{a.course_name}</TableCell>
                            <TableCell>{a.due_date}</TableCell>
                            <TableCell>{a.total_students}</TableCell>
                            <TableCell>{a.submitted_count}</TableCell>
                            <TableCell>
                              <Badge className={
                                a.submission_rate >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                a.submission_rate >= 50 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {a.submission_rate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Report */}
        <TabsContent value="progress">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Weekly Progress Report
                </CardTitle>
                <CardDescription>Track student progress over time</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedCourse || "all"} onValueChange={(v) => setSelectedCourse(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => exportReport('progress')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : progressReport && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-slate-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-500 uppercase">Total Records</p>
                        <p className="text-2xl font-semibold">{progressReport.summary.total_records}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-indigo-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-indigo-600 uppercase">Average Score</p>
                        <p className="text-2xl font-semibold text-indigo-600">{progressReport.summary.avg_score}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-emerald-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-emerald-600 uppercase">Highest</p>
                        <p className="text-2xl font-semibold text-emerald-600">{progressReport.summary.highest_score}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-amber-600 uppercase">Lowest</p>
                        <p className="text-2xl font-semibold text-amber-600">{progressReport.summary.lowest_score}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Table */}
                  <div className="table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-slate-50">Week</TableHead>
                          <TableHead className="bg-slate-50">Student</TableHead>
                          <TableHead className="bg-slate-50">Course</TableHead>
                          <TableHead className="bg-slate-50">Score</TableHead>
                          <TableHead className="bg-slate-50">Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {progressReport.records.slice(0, 20).map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{r.week_start}</TableCell>
                            <TableCell className="font-medium">{r.student_name}</TableCell>
                            <TableCell>{r.course_name}</TableCell>
                            <TableCell>
                              <Badge className={
                                r.performance_score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                r.performance_score >= 60 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {r.performance_score || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{r.remarks}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Class Summary */}
        <TabsContent value="class">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Class Summary Report
                </CardTitle>
                <CardDescription>Overview of class performance</CardDescription>
              </div>
              <Select value={selectedCourse || "none"} onValueChange={(v) => setSelectedCourse(v === "none" ? "" : v)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select Course</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {!selectedCourse ? (
                <p className="text-center text-slate-500 py-8">Select a course to view summary</p>
              ) : loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : classSummary && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-slate-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-500 uppercase">Total Students</p>
                        <p className="text-2xl font-semibold">{classSummary.summary.total_students}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-indigo-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-indigo-600 uppercase">Course</p>
                        <p className="text-lg font-semibold text-indigo-600">{classSummary.summary.course_name}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-emerald-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-emerald-600 uppercase">Avg Attendance</p>
                        <p className="text-2xl font-semibold text-emerald-600">{classSummary.summary.avg_attendance}%</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-amber-600 uppercase">Avg Progress</p>
                        <p className="text-2xl font-semibold text-amber-600">{classSummary.summary.avg_progress_score}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Students Table */}
                  <div className="table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-slate-50">Student ID</TableHead>
                          <TableHead className="bg-slate-50">Name</TableHead>
                          <TableHead className="bg-slate-50">Grade</TableHead>
                          <TableHead className="bg-slate-50">Attendance</TableHead>
                          <TableHead className="bg-slate-50">Assignments</TableHead>
                          <TableHead className="bg-slate-50">Avg Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classSummary.students.map((s) => (
                          <TableRow key={s.student_id}>
                            <TableCell className="font-medium">{s.student_id}</TableCell>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>{s.grade} {s.section}</TableCell>
                            <TableCell>
                              <Badge className={
                                s.attendance_percentage >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                s.attendance_percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {s.attendance_percentage}%
                              </Badge>
                            </TableCell>
                            <TableCell>{s.assignments_submitted}/{s.assignments_total}</TableCell>
                            <TableCell>
                              <Badge className={
                                s.avg_progress_score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                s.avg_progress_score >= 60 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {s.avg_progress_score || '-'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Performance */}
        <TabsContent value="student">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Student Performance Report
                </CardTitle>
                <CardDescription>Individual student performance across all courses</CardDescription>
              </div>
              <Select value={selectedStudent || "none"} onValueChange={(v) => setSelectedStudent(v === "none" ? "" : v)}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select Student</SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.user?.name} ({s.student_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {!selectedStudent ? (
                <p className="text-center text-slate-500 py-8">Select a student to view performance</p>
              ) : loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : studentPerformance && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-slate-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-500 uppercase">Student</p>
                        <p className="text-lg font-semibold">{studentPerformance.summary.name}</p>
                        <p className="text-sm text-slate-500">{studentPerformance.summary.grade} {studentPerformance.summary.section}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-indigo-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-indigo-600 uppercase">Total Courses</p>
                        <p className="text-2xl font-semibold text-indigo-600">{studentPerformance.summary.total_courses}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-emerald-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-emerald-600 uppercase">Overall Attendance</p>
                        <p className="text-2xl font-semibold text-emerald-600">{studentPerformance.summary.overall_attendance}%</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-amber-600 uppercase">Overall Progress</p>
                        <p className="text-2xl font-semibold text-amber-600">{studentPerformance.summary.overall_progress_score}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Courses Table */}
                  <div className="table-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-slate-50">Course</TableHead>
                          <TableHead className="bg-slate-50">Code</TableHead>
                          <TableHead className="bg-slate-50">Attendance</TableHead>
                          <TableHead className="bg-slate-50">Assignments</TableHead>
                          <TableHead className="bg-slate-50">Avg Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentPerformance.courses.map((c) => (
                          <TableRow key={c.course_id}>
                            <TableCell className="font-medium">{c.course_name}</TableCell>
                            <TableCell>{c.course_code}</TableCell>
                            <TableCell>
                              <Badge className={
                                c.attendance_percentage >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                c.attendance_percentage >= 60 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {c.attendance_percentage}% ({c.attendance_present}/{c.attendance_total})
                              </Badge>
                            </TableCell>
                            <TableCell>{c.assignments_submitted}/{c.assignments_total}</TableCell>
                            <TableCell>
                              <Badge className={
                                c.avg_progress_score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                c.avg_progress_score >= 60 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {c.avg_progress_score || '-'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Reports;
