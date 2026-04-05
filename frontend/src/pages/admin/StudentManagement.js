import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editStudent, setEditStudent] = useState(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [editForm, setEditForm] = useState({ grade: '', section: '', parent_contact: '', address: '' });

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleEditStudent = async () => {
    try {
      await axios.put(`${API_URL}/api/students/${editStudent.id}`, editForm);
      toast.success('Student updated successfully');
      setEditStudent(null);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to update student');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/students/${studentId}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/api/enrollments`, {
        student_id: selectedStudent.id,
        course_id: selectedCourse
      });
      toast.success('Student enrolled successfully');
      setEnrollDialogOpen(false);
      setSelectedStudent(null);
      setSelectedCourse('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to enroll student');
    }
  };

  const openEditDialog = (student) => {
    setEditStudent(student);
    setEditForm({
      grade: student.grade || '',
      section: student.section || '',
      parent_contact: student.parent_contact || '',
      address: student.address || ''
    });
  };

  const openEnrollDialog = (student) => {
    setSelectedStudent(student);
    setEnrollDialogOpen(true);
  };

  const filteredStudents = students.filter(student => 
    student.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    student.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout title="Student Management">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Management">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            Student Directory
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64"
                data-testid="student-search-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-slate-50">Student ID</TableHead>
                  <TableHead className="bg-slate-50">Name</TableHead>
                  <TableHead className="bg-slate-50">Email</TableHead>
                  <TableHead className="bg-slate-50">Grade</TableHead>
                  <TableHead className="bg-slate-50">Section</TableHead>
                  <TableHead className="bg-slate-50 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} data-testid={`student-row-${student.id}`}>
                    <TableCell className="font-medium">{student.student_id}</TableCell>
                    <TableCell>{student.user?.name || 'N/A'}</TableCell>
                    <TableCell>{student.user?.email || 'N/A'}</TableCell>
                    <TableCell>{student.grade || '-'}</TableCell>
                    <TableCell>{student.section || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEnrollDialog(student)}
                          data-testid={`enroll-btn-${student.id}`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Enroll
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(student)}
                          data-testid={`edit-student-btn-${student.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-student-btn-${student.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No students found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Student Dialog */}
      <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={editForm.grade}
                  onChange={(e) => setEditForm({...editForm, grade: e.target.value})}
                  data-testid="edit-student-grade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={editForm.section}
                  onChange={(e) => setEditForm({...editForm, section: e.target.value})}
                  data-testid="edit-student-section"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_contact">Parent Contact</Label>
              <Input
                id="parent_contact"
                value={editForm.parent_contact}
                onChange={(e) => setEditForm({...editForm, parent_contact: e.target.value})}
                data-testid="edit-student-parent-contact"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                data-testid="edit-student-address"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditStudent(null)}>Cancel</Button>
              <Button onClick={handleEditStudent} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-student-btn">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Student in Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Enrolling: <span className="font-medium">{selectedStudent?.user?.name}</span>
            </p>
            <div className="space-y-2">
              <Label>Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger data-testid="enroll-course-select">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEnrollStudent} className="bg-indigo-600 hover:bg-indigo-700" data-testid="confirm-enroll-btn">
                Enroll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentManagement;
