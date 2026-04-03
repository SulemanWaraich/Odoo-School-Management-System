import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTeacher, setEditTeacher] = useState(null);
  const [editForm, setEditForm] = useState({ department: '', qualification: '', phone: '' });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/teachers`, { withCredentials: true });
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeacher = async () => {
    try {
      await axios.put(`${API_URL}/api/teachers/${editTeacher.id}`, editForm, { withCredentials: true });
      toast.success('Teacher updated successfully');
      setEditTeacher(null);
      fetchTeachers();
    } catch (error) {
      toast.error('Failed to update teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/teachers/${teacherId}`, { withCredentials: true });
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    } catch (error) {
      toast.error('Failed to delete teacher');
    }
  };

  const openEditDialog = (teacher) => {
    setEditTeacher(teacher);
    setEditForm({
      department: teacher.department || '',
      qualification: teacher.qualification || '',
      phone: teacher.phone || ''
    });
  };

  const filteredTeachers = teachers.filter(teacher => 
    teacher.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    teacher.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    teacher.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout title="Teacher Management">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Management">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            Teacher Directory
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
              data-testid="teacher-search-input"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-slate-50">Employee ID</TableHead>
                  <TableHead className="bg-slate-50">Name</TableHead>
                  <TableHead className="bg-slate-50">Email</TableHead>
                  <TableHead className="bg-slate-50">Department</TableHead>
                  <TableHead className="bg-slate-50">Qualification</TableHead>
                  <TableHead className="bg-slate-50 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id} data-testid={`teacher-row-${teacher.id}`}>
                    <TableCell className="font-medium">{teacher.employee_id}</TableCell>
                    <TableCell>{teacher.user?.name || 'N/A'}</TableCell>
                    <TableCell>{teacher.user?.email || 'N/A'}</TableCell>
                    <TableCell>{teacher.department || '-'}</TableCell>
                    <TableCell>{teacher.qualification || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(teacher)}
                          data-testid={`edit-teacher-btn-${teacher.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-teacher-btn-${teacher.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTeachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No teachers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Teacher Dialog */}
      <Dialog open={!!editTeacher} onOpenChange={() => setEditTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={editForm.department}
                onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                data-testid="edit-teacher-department"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={editForm.qualification}
                onChange={(e) => setEditForm({...editForm, qualification: e.target.value})}
                data-testid="edit-teacher-qualification"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                data-testid="edit-teacher-phone"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTeacher(null)}>Cancel</Button>
              <Button onClick={handleEditTeacher} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-teacher-btn">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherManagement;
