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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Calendar, Clock, MapPin, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const TimetableManagement = () => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [form, setForm] = useState({
    course_id: '',
    day_of_week: 0,
    start_time: '09:00',
    end_time: '10:00',
    room: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, coursesRes, conflictsRes] = await Promise.all([
        axios.get(`${API_URL}/api/timetable`, { withCredentials: true }),
        axios.get(`${API_URL}/api/courses`, { withCredentials: true }),
        axios.get(`${API_URL}/api/timetable/conflicts`, { withCredentials: true })
      ]);
      setEntries(entriesRes.data);
      setCourses(coursesRes.data);
      setConflicts(conflictsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.course_id || !form.start_time || !form.end_time) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      if (editEntry) {
        await axios.put(`${API_URL}/api/timetable/${editEntry.id}`, form, { withCredentials: true });
        toast.success('Entry updated');
      } else {
        await axios.post(`${API_URL}/api/timetable`, form, { withCredentials: true });
        toast.success('Entry created');
      }
      setDialogOpen(false);
      setEditEntry(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save entry');
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      await axios.delete(`${API_URL}/api/timetable/${entryId}`, { withCredentials: true });
      toast.success('Entry deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setForm({
      course_id: entry.course_id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      room: entry.room || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setForm({
      course_id: '',
      day_of_week: 0,
      start_time: '09:00',
      end_time: '10:00',
      room: ''
    });
  };

  const getEntriesForDay = (dayIndex) => {
    return entries.filter(e => e.day_of_week === dayIndex).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getColorForCourse = (courseId) => {
    const colors = [
      'bg-indigo-100 border-indigo-300 text-indigo-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-emerald-100 border-emerald-300 text-emerald-800',
      'bg-amber-100 border-amber-300 text-amber-800',
      'bg-rose-100 border-rose-300 text-rose-800',
      'bg-cyan-100 border-cyan-300 text-cyan-800'
    ];
    const idx = courses.findIndex(c => c.id === courseId);
    return colors[idx % colors.length];
  };

  if (loading) {
    return (
      <DashboardLayout title="Timetable Management">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Timetable Management">
      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">{conflicts.length} scheduling conflict(s) detected</p>
                <p className="text-sm text-amber-700">Review and resolve conflicts in the Conflicts tab</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calendar" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="conflicts">
              Conflicts {conflicts.length > 0 && <Badge className="ml-2 bg-red-500">{conflicts.length}</Badge>}
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Card className="dashboard-card">
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-8 border-b">
                  <div className="p-3 font-medium text-slate-500 bg-slate-50 text-center">Time</div>
                  {DAYS.slice(0, 6).map((day, idx) => (
                    <div key={day} className="p-3 font-medium text-slate-900 bg-slate-50 text-center border-l">
                      {day}
                    </div>
                  ))}
                  <div className="p-3 font-medium text-slate-900 bg-slate-50 text-center border-l">Sunday</div>
                </div>
                {TIME_SLOTS.map((time, timeIdx) => (
                  <div key={time} className="grid grid-cols-8 border-b last:border-b-0 min-h-[80px]">
                    <div className="p-2 text-sm text-slate-500 bg-slate-50 text-center flex items-center justify-center">
                      {time}
                    </div>
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                      const dayEntries = getEntriesForDay(dayIdx).filter(e => 
                        e.start_time <= time && e.end_time > time
                      );
                      return (
                        <div key={dayIdx} className="p-1 border-l relative">
                          {dayEntries.map((entry) => (
                            entry.start_time === time && (
                              <div 
                                key={entry.id}
                                className={`p-2 rounded border text-xs cursor-pointer transition-shadow hover:shadow-md ${getColorForCourse(entry.course_id)}`}
                                onClick={() => openEdit(entry)}
                                style={{
                                  minHeight: `${(parseInt(entry.end_time) - parseInt(entry.start_time)) * 80}px`
                                }}
                              >
                                <div className="font-medium truncate">{entry.course?.name || 'N/A'}</div>
                                <div className="flex items-center gap-1 mt-1 opacity-75">
                                  <Clock className="w-3 h-3" />
                                  {entry.start_time} - {entry.end_time}
                                </div>
                                {entry.room && (
                                  <div className="flex items-center gap-1 opacity-75">
                                    <MapPin className="w-3 h-3" />
                                    {entry.room}
                                  </div>
                                )}
                                <div className="text-xs opacity-75 truncate mt-1">
                                  {entry.teacher_user?.name || 'N/A'}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <Card className="dashboard-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-50">Day</TableHead>
                    <TableHead className="bg-slate-50">Time</TableHead>
                    <TableHead className="bg-slate-50">Course</TableHead>
                    <TableHead className="bg-slate-50">Teacher</TableHead>
                    <TableHead className="bg-slate-50">Room</TableHead>
                    <TableHead className="bg-slate-50 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{DAYS[entry.day_of_week]}</TableCell>
                      <TableCell>{entry.start_time} - {entry.end_time}</TableCell>
                      <TableCell>{entry.course?.name || 'N/A'}</TableCell>
                      <TableCell>{entry.teacher_user?.name || 'N/A'}</TableCell>
                      <TableCell>{entry.room || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {entries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No timetable entries yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflicts View */}
        <TabsContent value="conflicts">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg">Schedule Conflicts</CardTitle>
            </CardHeader>
            <CardContent>
              {conflicts.length > 0 ? (
                <div className="space-y-4">
                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">{conflict.message}</span>
                        <Badge className="bg-red-200 text-red-800 capitalize">{conflict.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-2 bg-white rounded border">
                          <p className="font-medium">{conflict.entry1.course?.name || 'Course 1'}</p>
                          <p className="text-slate-500">{DAYS[conflict.entry1.day_of_week]} {conflict.entry1.start_time}-{conflict.entry1.end_time}</p>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <p className="font-medium">{conflict.entry2.course?.name || 'Course 2'}</p>
                          <p className="text-slate-500">{DAYS[conflict.entry2.day_of_week]} {conflict.entry2.start_time}-{conflict.entry2.end_time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-slate-600">No scheduling conflicts detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editEntry ? 'Edit Entry' : 'Add Timetable Entry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select value={form.course_id} onValueChange={(v) => setForm({...form, course_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Day of Week *</Label>
              <Select value={form.day_of_week.toString()} onValueChange={(v) => setForm({...form, day_of_week: parseInt(v)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({...form, start_time: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({...form, end_time: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Room/Location</Label>
              <Input value={form.room} onChange={(e) => setForm({...form, room: e.target.value})} placeholder="e.g., Room 101" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
                {editEntry ? 'Save Changes' : 'Add Entry'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TimetableManagement;
