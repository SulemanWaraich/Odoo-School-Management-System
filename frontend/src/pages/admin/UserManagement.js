import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { 
  Search, Plus, Pencil, Trash2, KeyRound, UserCheck, UserX, 
  Shield, GraduationCap, Users 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'student',
    student_data: { grade: '', section: '' },
    teacher_data: { department: '', qualification: '' }
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);
      
      const response = await axios.get(`${API_URL}/api/admin/users/all?${params.toString()}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.name || !createForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/admin/users/create`, createForm);
      toast.success('User created successfully');
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}/role`, { role: newRole });
      toast.success('Role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}/status`, { is_active: !currentStatus });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/admin/users/${selectedUser.user_id}/reset-password`, 
        { password: newPassword }, 
        {}
      );
      toast.success('Password reset successfully');
      setResetPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      email: '',
      name: '',
      password: '',
      role: 'student',
      student_data: { grade: '', section: '' },
      teacher_data: { department: '', qualification: '' }
    });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'teacher':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><GraduationCap className="w-3 h-3 mr-1" />Teacher</Badge>;
      case 'student':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Users className="w-3 h-3 mr-1" />Student</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive === false) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Active</Badge>;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    students: users.filter(u => u.role === 'student').length,
    active: users.filter(u => u.is_active !== false).length,
    inactive: users.filter(u => u.is_active === false).length
  };

  return (
    <DashboardLayout title="User Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Users</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Admins</p>
            <p className="text-2xl font-semibold text-purple-600">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Teachers</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.teachers}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Students</p>
            <p className="text-2xl font-semibold text-green-600">{stats.students}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Active</p>
            <p className="text-2xl font-semibold text-emerald-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Inactive</p>
            <p className="text-2xl font-semibold text-red-600">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            All Users
          </CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 w-48"
                data-testid="user-search-input"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36" data-testid="role-filter">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36" data-testid="status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700" data-testid="create-user-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-50">User</TableHead>
                    <TableHead className="bg-slate-50">Email</TableHead>
                    <TableHead className="bg-slate-50">Role</TableHead>
                    <TableHead className="bg-slate-50">Status</TableHead>
                    <TableHead className="bg-slate-50">Created</TableHead>
                    <TableHead className="bg-slate-50 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id} data-testid={`user-row-${user.user_id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.picture} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                      <TableCell>{user.created_at ? format(new Date(user.created_at), 'PP') : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Select 
                            value={user.role} 
                            onValueChange={(value) => handleUpdateRole(user.user_id, value)}
                          >
                            <SelectTrigger className="w-28 h-8" data-testid={`role-select-${user.user_id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user.user_id, user.is_active !== false)}
                            title={user.is_active !== false ? 'Deactivate' : 'Activate'}
                            data-testid={`toggle-status-btn-${user.user_id}`}
                          >
                            {user.is_active !== false ? (
                              <UserX className="w-4 h-4 text-amber-600" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setResetPasswordDialogOpen(true);
                            }}
                            title="Reset Password"
                            data-testid={`reset-password-btn-${user.user_id}`}
                          >
                            <KeyRound className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete User"
                            data-testid={`delete-user-btn-${user.user_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="John Doe"
                  data-testid="create-user-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  placeholder="john@school.com"
                  data-testid="create-user-email"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  placeholder="Min 6 characters"
                  data-testid="create-user-password"
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm({...createForm, role: value})}>
                  <SelectTrigger data-testid="create-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {createForm.role === 'student' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Input
                    value={createForm.student_data.grade}
                    onChange={(e) => setCreateForm({
                      ...createForm, 
                      student_data: {...createForm.student_data, grade: e.target.value}
                    })}
                    placeholder="Grade 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input
                    value={createForm.student_data.section}
                    onChange={(e) => setCreateForm({
                      ...createForm, 
                      student_data: {...createForm.student_data, section: e.target.value}
                    })}
                    placeholder="A"
                  />
                </div>
              </div>
            )}

            {createForm.role === 'teacher' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={createForm.teacher_data.department}
                    onChange={(e) => setCreateForm({
                      ...createForm, 
                      teacher_data: {...createForm.teacher_data, department: e.target.value}
                    })}
                    placeholder="Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input
                    value={createForm.teacher_data.qualification}
                    onChange={(e) => setCreateForm({
                      ...createForm, 
                      teacher_data: {...createForm.teacher_data, qualification: e.target.value}
                    })}
                    placeholder="Ph.D."
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser} className="bg-indigo-600 hover:bg-indigo-700" data-testid="submit-create-user">
                Create User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Resetting password for: <span className="font-medium">{selectedUser?.name}</span> ({selectedUser?.email})
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                data-testid="new-password-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleResetPassword} className="bg-indigo-600 hover:bg-indigo-700" data-testid="confirm-reset-password">
                Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserManagement;
