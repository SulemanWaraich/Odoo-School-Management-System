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
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', grade: '', teacher_id: '' });

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/teachers`);
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.grade) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editCourse) {
        await axios.put(`${API_URL}/api/courses/${editCourse.id}`, form);
        toast.success('Course updated successfully');
      } else {
        await axios.post(`${API_URL}/api/courses`, form);
        toast.success('Course created successfully');
      }
      setDialogOpen(false);
      setEditCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/courses/${courseId}`);
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setEditCourse(null);
    setDialogOpen(true);
  };

  const openEditDialog = (course) => {
    setEditCourse(course);
    setForm({
      name: course.name,
      code: course.code,
      description: course.description || '',
      grade: course.grade,
      teacher_id: course.teacher_id || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setForm({ name: '', code: '', description: '', grade: '', teacher_id: '' });
  };

  const filteredCourses = courses.filter(course => 
    course.name?.toLowerCase().includes(search.toLowerCase()) ||
    course.code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout title="Course Management">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Course Management">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            Course Directory
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64"
                data-testid="course-search-input"
              />
            </div>
            <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-course-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-slate-50">Code</TableHead>
                  <TableHead className="bg-slate-50">Name</TableHead>
                  <TableHead className="bg-slate-50">Grade</TableHead>
                  <TableHead className="bg-slate-50">Teacher</TableHead>
                  <TableHead className="bg-slate-50 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id} data-testid={`course-row-${course.id}`}>
                    <TableCell className="font-medium">{course.code}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{course.grade}</TableCell>
                    <TableCell>{course.teacher_user?.name || 'Not assigned'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(course)}
                          data-testid={`edit-course-btn-${course.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-course-btn-${course.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCourses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No courses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Course Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="Mathematics"
                  data-testid="course-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({...form, code: e.target.value})}
                  placeholder="MATH101"
                  disabled={!!editCourse}
                  data-testid="course-code-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Input
                  id="grade"
                  value={form.grade}
                  onChange={(e) => setForm({...form, grade: e.target.value})}
                  placeholder="Grade 10"
                  data-testid="course-grade-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher">Assign Teacher</Label>
                <Select value={form.teacher_id || "none"} onValueChange={(value) => setForm({...form, teacher_id: value === "none" ? "" : value})}>
                  <SelectTrigger data-testid="course-teacher-select">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No teacher</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.user?.name || teacher.employee_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Course description..."
                rows={3}
                data-testid="course-description-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-course-btn">
                {editCourse ? 'Save Changes' : 'Create Course'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CourseManagement;
