import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Award, BookOpen, Users, TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GradesManagement = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [examForm, setExamForm] = useState({
    course_id: '',
    title: '',
    exam_type: 'exam',
    date: format(new Date(), 'yyyy-MM-dd'),
    max_marks: 100,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overviewRes, examsRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/api/performance/overview`, { withCredentials: true }),
        axios.get(`${API_URL}/api/exams`, { withCredentials: true }),
        axios.get(`${API_URL}/api/courses`, { withCredentials: true })
      ]);
      setOverview(overviewRes.data);
      setExams(examsRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async () => {
    if (!examForm.course_id || !examForm.title) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      if (editExam) {
        await axios.put(`${API_URL}/api/exams/${editExam.id}`, examForm, { withCredentials: true });
        toast.success('Exam updated');
      } else {
        await axios.post(`${API_URL}/api/exams`, examForm, { withCredentials: true });
        toast.success('Exam created');
      }
      setExamDialogOpen(false);
      setEditExam(null);
      resetExamForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save exam');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Delete this exam and all its results?')) return;
    try {
      await axios.delete(`${API_URL}/api/exams/${examId}`, { withCredentials: true });
      toast.success('Exam deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete exam');
    }
  };

  const openEditExam = (exam) => {
    setEditExam(exam);
    setExamForm({
      course_id: exam.course_id,
      title: exam.title,
      exam_type: exam.exam_type,
      date: exam.date,
      max_marks: exam.max_marks,
      description: exam.description || ''
    });
    setExamDialogOpen(true);
  };

  const resetExamForm = () => {
    setExamForm({
      course_id: '',
      title: '',
      exam_type: 'exam',
      date: format(new Date(), 'yyyy-MM-dd'),
      max_marks: 100,
      description: ''
    });
  };

  const COLORS = ['#6366F1', '#8B5CF6', '#A855F7', '#C084FC', '#E879F9'];

  if (loading) {
    return (
      <DashboardLayout title="Grades & Exams">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Grades & Exams">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Assignment Grades</p>
                <p className="text-2xl font-bold text-slate-900">{overview?.summary?.total_assignment_grades || 0}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Exam Results</p>
                <p className="text-2xl font-bold text-slate-900">{overview?.summary?.total_exam_results || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Score</p>
                <p className="text-2xl font-bold text-slate-900">{overview?.summary?.avg_assignment_score || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Grading Completion</p>
                <p className="text-2xl font-bold text-slate-900">{overview?.summary?.grading_completion || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <Progress value={overview?.summary?.grading_completion || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Performance Chart */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Course Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview?.course_performance || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="course_code" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                        formatter={(value) => [`${value}%`, 'Avg Score']}
                      />
                      <Bar dataKey="average_percentage" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Grading Status */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Grading Status by Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview?.course_performance?.map((course, idx) => (
                    <div key={course.course_id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{course.course_name}</span>
                        <span className="text-slate-500">
                          {course.assignments_graded + course.exams_graded} graded
                        </span>
                      </div>
                      <Progress 
                        value={course.average_percentage} 
                        className="h-2"
                        style={{ '--progress-background': COLORS[idx % COLORS.length] }}
                      />
                    </div>
                  ))}
                  {(!overview?.course_performance || overview.course_performance.length === 0) && (
                    <p className="text-center text-slate-500 py-8">No grading data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exams">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Exams</CardTitle>
              <Button onClick={() => { resetExamForm(); setExamDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-50">Title</TableHead>
                    <TableHead className="bg-slate-50">Course</TableHead>
                    <TableHead className="bg-slate-50">Type</TableHead>
                    <TableHead className="bg-slate-50">Date</TableHead>
                    <TableHead className="bg-slate-50">Max Marks</TableHead>
                    <TableHead className="bg-slate-50 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.course?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 capitalize">
                          {exam.exam_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(exam.date), 'PPP')}</TableCell>
                      <TableCell>{exam.max_marks}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditExam(exam)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteExam(exam.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {exams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No exams created yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editExam ? 'Edit Exam' : 'Create Exam'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select value={examForm.course_id} onValueChange={(v) => setExamForm({...examForm, course_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={examForm.title} onChange={(e) => setExamForm({...examForm, title: e.target.value})} placeholder="Exam title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={examForm.exam_type} onValueChange={(v) => setExamForm({...examForm, exam_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Marks</Label>
                <Input type="number" value={examForm.max_marks} onChange={(e) => setExamForm({...examForm, max_marks: parseInt(e.target.value) || 100})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={examForm.date} onChange={(e) => setExamForm({...examForm, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={examForm.description} onChange={(e) => setExamForm({...examForm, description: e.target.value})} placeholder="Exam description..." rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setExamDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateExam} className="bg-indigo-600 hover:bg-indigo-700">
                {editExam ? 'Save Changes' : 'Create Exam'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default GradesManagement;
