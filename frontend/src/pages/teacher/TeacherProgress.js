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
import { Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TeacherProgress = () => {
  const [progress, setProgress] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    course_id: '',
    week_start: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
    remarks: '',
    performance_score: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchProgress();
      fetchEnrolledStudents();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`, { withCredentials: true });
      setCourses(response.data);
      if (response.data.length > 0) {
        setSelectedCourse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/progress?course_id=${selectedCourse}`, { withCredentials: true });
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const enrollResponse = await axios.get(`${API_URL}/api/enrollments?course_id=${selectedCourse}`, { withCredentials: true });
      const studentIds = enrollResponse.data.map(e => e.student_id);
      
      const studentsResponse = await axios.get(`${API_URL}/api/students`, { withCredentials: true });
      const enrolledStudents = studentsResponse.data.filter(s => studentIds.includes(s.id));
      setStudents(enrolledStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.student_id || !form.remarks) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/progress`, {
        ...form,
        course_id: selectedCourse,
        performance_score: form.performance_score ? parseInt(form.performance_score) : null
      }, { withCredentials: true });
      toast.success('Progress recorded successfully');
      setDialogOpen(false);
      resetForm();
      fetchProgress();
    } catch (error) {
      toast.error('Failed to record progress');
    }
  };

  const resetForm = () => {
    setForm({
      student_id: '',
      course_id: selectedCourse,
      week_start: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
      remarks: '',
      performance_score: ''
    });
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const getScoreColor = (score) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <DashboardLayout title="Weekly Progress">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Weekly Progress">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            Student Progress Records
          </CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-48" data-testid="progress-course-select">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={openAddDialog} 
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="add-progress-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Progress
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-slate-50">Student</TableHead>
                  <TableHead className="bg-slate-50">Week</TableHead>
                  <TableHead className="bg-slate-50">Score</TableHead>
                  <TableHead className="bg-slate-50">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.map((record) => (
                  <TableRow key={record.id} data-testid={`progress-row-${record.id}`}>
                    <TableCell className="font-medium">{record.student_user?.name || 'Unknown'}</TableCell>
                    <TableCell>{record.week_start}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-4 h-4 ${getScoreColor(record.performance_score)}`} />
                        <span className={`font-medium ${getScoreColor(record.performance_score)}`}>
                          {record.performance_score || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{record.remarks}</TableCell>
                  </TableRow>
                ))}
                {progress.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      No progress records yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Progress Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Weekly Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={form.student_id} onValueChange={(value) => setForm({...form, student_id: value})}>
                <SelectTrigger data-testid="progress-student-select">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.user?.name || student.student_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="week_start">Week Starting</Label>
                <Input
                  id="week_start"
                  type="date"
                  value={form.week_start}
                  onChange={(e) => setForm({...form, week_start: e.target.value})}
                  data-testid="progress-week-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performance_score">Score (0-100)</Label>
                <Input
                  id="performance_score"
                  type="number"
                  min="0"
                  max="100"
                  value={form.performance_score}
                  onChange={(e) => setForm({...form, performance_score: e.target.value})}
                  placeholder="Optional"
                  data-testid="progress-score-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks *</Label>
              <Textarea
                id="remarks"
                value={form.remarks}
                onChange={(e) => setForm({...form, remarks: e.target.value})}
                placeholder="Student's progress notes for this week..."
                rows={3}
                data-testid="progress-remarks-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-progress-btn">
                Save Progress
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherProgress;
