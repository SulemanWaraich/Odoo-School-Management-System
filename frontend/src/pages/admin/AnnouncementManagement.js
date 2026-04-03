import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', target_role: 'all', course_id: '' });

  useEffect(() => {
    fetchAnnouncements();
    fetchCourses();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/announcements`, { withCredentials: true });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`, { withCredentials: true });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!form.title || !form.content) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/announcements`, {
        ...form,
        course_id: form.course_id || null
      }, { withCredentials: true });
      toast.success('Announcement created successfully');
      setDialogOpen(false);
      setForm({ title: '', content: '', target_role: 'all', course_id: '' });
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await axios.delete(`${API_URL}/api/announcements/${announcementId}`, { withCredentials: true });
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const getTargetLabel = (role) => {
    switch (role) {
      case 'all': return 'Everyone';
      case 'student': return 'Students Only';
      case 'teacher': return 'Teachers Only';
      default: return role;
    }
  };

  return (
    <DashboardLayout title="Announcements">
      <div className="flex items-center justify-between mb-6">
        <div></div>
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700" data-testid="create-announcement-btn">
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="dashboard-card" data-testid={`announcement-card-${announcement.id}`}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
                      {announcement.title}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      {format(new Date(announcement.created_at), 'PPP')} • {getTargetLabel(announcement.target_role)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                  className="text-red-600 hover:text-red-700"
                  data-testid={`delete-announcement-btn-${announcement.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
          {announcements.length === 0 && (
            <Card className="dashboard-card">
              <CardContent className="py-12 text-center text-slate-500">
                No announcements yet. Create one to get started.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Announcement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="Announcement title"
                data-testid="announcement-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({...form, content: e.target.value})}
                placeholder="Announcement content..."
                rows={4}
                data-testid="announcement-content-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={form.target_role} onValueChange={(value) => setForm({...form, target_role: value})}>
                  <SelectTrigger data-testid="announcement-target-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="student">Students Only</SelectItem>
                    <SelectItem value="teacher">Teachers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course (Optional)</Label>
                <Select value={form.course_id || "all"} onValueChange={(value) => setForm({...form, course_id: value === "all" ? "" : value})}>
                  <SelectTrigger data-testid="announcement-course-select">
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAnnouncement} className="bg-indigo-600 hover:bg-indigo-700" data-testid="submit-announcement-btn">
                Create Announcement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AnnouncementManagement;
