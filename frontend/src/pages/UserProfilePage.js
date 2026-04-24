import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { AlertCircle, Mail, User, Phone, MapPin, Briefcase, BookOpen, GraduationCap, Save } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const UserProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setProfileData(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/users/profile`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setProfileData(formData);
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'teacher': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Briefcase className="w-4 h-4" />;
      case 'teacher': return <BookOpen className="w-4 h-4" />;
      case 'student': return <GraduationCap className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="User Profile">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Profile">
      <div className="max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                    {getInitials(profileData?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profileData?.name}</h1>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" /> {profileData?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={`${getRoleColor(profileData?.role)} border-0 gap-2`}>
                      {getRoleIcon(profileData?.role)}
                      {profileData?.role?.charAt(0).toUpperCase() + profileData?.role?.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              {!editMode && (
                <Button
                  onClick={() => setEditMode(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Content */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6 border-b bg-transparent p-0">
            <TabsTrigger value="general" className="border-b-2 border-transparent data-[state=active]:border-indigo-600">
              General Information
            </TabsTrigger>
            <TabsTrigger value="details" className="border-b-2 border-transparent data-[state=active]:border-indigo-600">
              {profileData?.role === 'student' ? 'Student Details' : profileData?.role === 'teacher' ? 'Teacher Details' : 'Admin Details'}
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {editMode ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="font-semibold">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="font-semibold">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email || ''}
                          disabled
                          className="mt-2 bg-slate-100"
                        />
                      </div>
                    </div>

                    {formData.phone !== undefined && (
                      <div>
                        <Label htmlFor="phone" className="font-semibold">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className="mt-2"
                          placeholder="Enter phone number"
                        />
                      </div>
                    )}

                    {formData.address !== undefined && (
                      <div>
                        <Label htmlFor="address" className="font-semibold">Address</Label>
                        <Textarea
                          id="address"
                          name="address"
                          value={formData.address || ''}
                          onChange={handleInputChange}
                          className="mt-2"
                          placeholder="Enter your address"
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditMode(false);
                          setFormData(profileData);
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                      <User className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-semibold text-gray-900">{profileData?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                      <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Email Address</p>
                        <p className="font-semibold text-gray-900">{profileData?.email}</p>
                      </div>
                    </div>

                    {profileData?.phone && (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                        <Phone className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Phone Number</p>
                          <p className="font-semibold text-gray-900">{profileData?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    )}

                    {profileData?.address && (
                      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-semibold text-gray-900">{profileData?.address || 'Not provided'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>
                  {profileData?.role === 'student' && 'Student Information'}
                  {profileData?.role === 'teacher' && 'Teacher Information'}
                  {profileData?.role === 'admin' && 'Administrator Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileData?.role === 'student' && (
                  <div className="space-y-4">
                    {profileData?.student_id && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <GraduationCap className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Student ID</p>
                          <p className="font-semibold text-gray-900">{profileData?.student_id}</p>
                        </div>
                      </div>
                    )}
                    {profileData?.grade && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <BookOpen className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Grade</p>
                          <p className="font-semibold text-gray-900">{profileData?.grade}</p>
                        </div>
                      </div>
                    )}
                    {profileData?.section && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <BookOpen className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Section</p>
                          <p className="font-semibold text-gray-900">{profileData?.section}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {profileData?.role === 'teacher' && (
                  <div className="space-y-4">
                    {profileData?.employee_id && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Briefcase className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Employee ID</p>
                          <p className="font-semibold text-gray-900">{profileData?.employee_id}</p>
                        </div>
                      </div>
                    )}
                    {profileData?.department && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-semibold text-gray-900">{profileData?.department}</p>
                        </div>
                      </div>
                    )}
                    {profileData?.qualification && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <GraduationCap className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Qualification</p>
                          <p className="font-semibold text-gray-900">{profileData?.qualification}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {profileData?.role === 'admin' && (
                  <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <Briefcase className="w-6 h-6 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Administrator Account</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      You have full access to the system including user management, course setup, and administrative functions.
                    </p>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>✓ Manage Users (Students, Teachers, Admins)</p>
                      <p>✓ Configure Courses and Timetables</p>
                      <p>✓ View System Reports and Analytics</p>
                      <p>✓ System Settings and Configuration</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Account Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-gray-600">
              <span className="font-semibold">Role:</span> {profileData?.role?.charAt(0).toUpperCase() + profileData?.role?.slice(1)}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Account Created:</span> {profileData?.created_at ? new Date(profileData?.created_at).toLocaleDateString() : 'N/A'}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Last Updated:</span> {profileData?.updated_at ? new Date(profileData?.updated_at).toLocaleDateString() : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserProfilePage;
