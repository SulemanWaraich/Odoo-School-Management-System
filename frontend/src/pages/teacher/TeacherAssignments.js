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
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Badge } from '../../components/ui/badge';
import { Plus, CalendarIcon, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editAssignment, setEditAssignment] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    course_id: '',
    due_date: new Date(),
    max_score: 100
  });

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`, { withCredentials: true });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assignments`, { withCredentials: true });
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      const response = await axios.get(`${API_URL}/api/submissions?assignment_id=${assignmentId}`, { withCredentials: true });
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.course_id) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const payload = {
        ...form,
        due_date: format(form.due_date, 'yyyy-MM-dd')
      };

      if (editAssignment) {
        await axios.put(`${API_URL}/api/assignments/${editAssignment.id}`, payload, { withCredentials: true });
        toast.success('Assignment updated successfully');
      } else {
        await axios.post(`${API_URL}/api/assignments`, payload, { withCredentials: true });
        toast.success('Assignment created successfully');
      }
      setDialogOpen(false);
      setEditAssignment(null);
      resetForm();
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save assignment');
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await axios.delete(`${API_URL}/api/assignments/${assignmentId}`, { withCredentials: true });
      toast.success('Assignment deleted');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const openEditDialog = (assignment) => {
    setEditAssignment(assignment);
    setForm({
      title: assignment.title,
      description: assignment.description || '',
      course_id: assignment.course_id,
      due_date: new Date(assignment.due_date),
      max_score: assignment.max_score
    });
    setDialogOpen(true);
  };

  const openSubmissionsDialog = (assignment) => {
    setSelectedAssignment(assignment);
    fetchSubmissions(assignment.id);
    setSubmissionsDialogOpen(true);
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      course_id: courses.length > 0 ? courses[0].id : '',
      due_date: new Date(),
      max_score: 100
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <DashboardLayout title="Assignments">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Assignments">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            My Assignments
          </CardTitle>
          <Button 
            onClick={() => { resetForm(); setDialogOpen(true); }} 
            className="bg-indigo-600 hover:bg-indigo-700"
            data-testid="create-assignment-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        </CardHeader>
        <CardContent>
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-slate-50">Title</TableHead>
                  <TableHead className="bg-slate-50">Course</TableHead>
                  <TableHead className="bg-slate-50">Due Date</TableHead>
                  <TableHead className="bg-slate-50">Max Score</TableHead>
                  <TableHead className="bg-slate-50">Status</TableHead>
                  <TableHead className="bg-slate-50 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id} data-testid={`assignment-row-${assignment.id}`}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{assignment.course?.name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(assignment.due_date), 'PPP')}</TableCell>
                    <TableCell>{assignment.max_score}</TableCell>
                    <TableCell>
                      {isOverdue(assignment.due_date) ? (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Past Due</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSubmissionsDialog(assignment)}
                          data-testid={`view-submissions-btn-${assignment.id}`}
                        >
                          Submissions
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(assignment)}
                          data-testid={`edit-assignment-btn-${assignment.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assignment.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-assignment-btn-${assignment.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {assignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No assignments yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editAssignment ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="Assignment title"
                data-testid="assignment-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Select value={form.course_id} onValueChange={(value) => setForm({...form, course_id: value})}>
                <SelectTrigger data-testid="assignment-course-select">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" data-testid="assignment-due-date-picker">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(form.due_date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.due_date}
                      onSelect={(date) => date && setForm({...form, due_date: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_score">Max Score</Label>
                <Input
                  id="max_score"
                  type="number"
                  value={form.max_score}
                  onChange={(e) => setForm({...form, max_score: parseInt(e.target.value) || 100})}
                  data-testid="assignment-max-score-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Assignment instructions..."
                rows={3}
                data-testid="assignment-description-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-assignment-btn">
                {editAssignment ? 'Save Changes' : 'Create Assignment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={submissionsDialogOpen} onOpenChange={setSubmissionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submissions - {selectedAssignment?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.student_user?.name || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(submission.submitted_at), 'PPP p')}</TableCell>
                      <TableCell>
                        {submission.file_name || 'No file'}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          {submission.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-slate-500">No submissions yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherAssignments;
