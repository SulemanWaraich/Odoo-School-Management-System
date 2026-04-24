import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import GoogleCalendarIntegration from '../../components/GoogleCalendarIntegration';
import CalendarSyncButton from '../../components/CalendarSyncButton';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Calendar, Clock, MapPin, Plus, Pencil, Trash2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const SLOT_HEIGHT = 80;

const normalizeTime = (t) => {
  if (!t) return '00:00';
  const str = t.substring(0, 5);
  return str.length === 4 ? `0${str}` : str;
};

const timeToMinutes = (t) => {
  const [h, m] = normalizeTime(t).split(':').map(Number);
  return h * 60 + m;
};

// ── Google Events Section ─────────────────────────────────────────────────────

const GoogleEventsSection = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isIntegrated, setIsIntegrated] = useState(false);

  useEffect(() => {
    checkAndFetch();
  }, []);

  const checkAndFetch = async () => {
    try {
      const statusRes = await axios.get(`${API_URL}/api/calendar/integration/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setIsIntegrated(statusRes.data.is_integrated);
      if (statusRes.data.is_integrated) {
        await fetchEvents();
      }
    } catch (err) {
      setIsIntegrated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/calendar/events?days_ahead=30`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setEvents(res.data.events || []);
    } catch (err) {
      toast.error('Failed to fetch Google Calendar events');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    if (!isoString.includes('T')) {
      return new Date(isoString + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      });
    }
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const isAllDay = (event) => event.start && !event.start.includes('T');

  if (!isIntegrated) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="font-medium text-slate-600">Google Calendar not connected</p>
        <p className="text-sm mt-1">Connect your Google Calendar in the "Google Calendar" tab to see your upcoming events here.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="font-medium">No upcoming events</p>
        <p className="text-sm mt-1">Your Google Calendar has no events in the next 30 days.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-100 text-indigo-700">Next 30 days</Badge>
          <span className="text-sm text-slate-500">{events.length} event{events.length !== 1 ? 's' : ''}</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEvents} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
        >
          <div className="w-3 h-3 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{event.title || '(No title)'}</p>
            <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {isAllDay(event)
                ? <span>All day · {formatDateTime(event.start)}</span>
                : <span>{formatDateTime(event.start)} → {formatDateTime(event.end)}</span>
              }
            </div>
            {event.location && (
              <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {event.description && (
              <p className="text-xs text-slate-400 mt-1 truncate">{event.description}</p>
            )}
          </div>
          <a
            href="https://calendar.google.com/calendar/r"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-indigo-600 flex-shrink-0"
            title="Open in Google Calendar"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

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
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar') === 'connected') {
      toast.success('Google Calendar connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, coursesRes, conflictsRes] = await Promise.all([
        axios.get(`${API_URL}/api/timetable`),
        axios.get(`${API_URL}/api/courses`),
        axios.get(`${API_URL}/api/timetable/conflicts`)
      ]);
      const normalized = entriesRes.data.map(e => ({
        ...e,
        start_time: normalizeTime(e.start_time),
        end_time: normalizeTime(e.end_time)
      }));
      setEntries(normalized);
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
        await axios.put(`${API_URL}/api/timetable/${editEntry.id}`, form);
        toast.success('Entry updated');
      } else {
        await axios.post(`${API_URL}/api/timetable`, form);
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
      await axios.delete(`${API_URL}/api/timetable/${entryId}`);
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
    setForm({ course_id: '', day_of_week: 0, start_time: '09:00', end_time: '10:00', room: '' });
  };

  const getEntriesForDay = (dayIndex) => {
    return entries
      .filter(e => e.day_of_week === dayIndex)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  };

  const entryStartsInSlot = (entry, slotTime) => {
    const slotStart = timeToMinutes(slotTime);
    const slotEnd = slotStart + 60;
    const entryStart = timeToMinutes(entry.start_time);
    return entryStart >= slotStart && entryStart < slotEnd;
  };

  const getEntryHeight = (entry) => {
    const durationMinutes = timeToMinutes(entry.end_time) - timeToMinutes(entry.start_time);
    return Math.max((durationMinutes / 60) * SLOT_HEIGHT, SLOT_HEIGHT * 0.5);
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
    return colors[Math.max(idx, 0) % colors.length];
  };

  if (loading) {
    return (
      <DashboardLayout title="Timetable Management">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Timetable Management">
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
            <TabsTrigger value="calendar-integration">Google Calendar</TabsTrigger>
            <TabsTrigger value="my-events" className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              My Events
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
                  {DAYS.map((day) => (
                    <div key={day} className="p-3 font-medium text-slate-900 bg-slate-50 text-center border-l">
                      {day}
                    </div>
                  ))}
                </div>
                {TIME_SLOTS.map((time) => (
                  <div key={time} className="grid grid-cols-8 border-b last:border-b-0" style={{ minHeight: `${SLOT_HEIGHT}px` }}>
                    <div className="p-2 text-sm text-slate-500 bg-slate-50 text-center flex items-start justify-center pt-3">
                      {time}
                    </div>
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                      const slotEntries = getEntriesForDay(dayIdx).filter(e => entryStartsInSlot(e, time));
                      return (
                        <div key={dayIdx} className="p-1 border-l relative">
                          {slotEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className={`p-2 rounded border text-xs cursor-pointer transition-shadow hover:shadow-md mb-1 ${getColorForCourse(entry.course_id)}`}
                              onClick={() => openEdit(entry)}
                              style={{ height: `${getEntryHeight(entry)}px`, overflow: 'hidden' }}
                            >
                              <div className="font-medium truncate">{entry.course?.name || 'N/A'}</div>
                              <div className="flex items-center gap-1 mt-1 opacity-75">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{entry.start_time} - {entry.end_time}</span>
                              </div>
                              {entry.room && (
                                <div className="flex items-center gap-1 opacity-75">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{entry.room}</span>
                                </div>
                              )}
                              <div className="text-xs opacity-75 truncate mt-1">
                                {entry.teacher_user?.name || 'N/A'}
                              </div>
                            </div>
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
                    <TableHead className="bg-slate-50 text-center">Calendar</TableHead>
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
                      <TableCell className="text-center">
                        <CalendarSyncButton timetableId={entry.id} isSynced={entry.is_synced_to_calendar} />
                      </TableCell>
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
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
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

        {/* Google Calendar Integration Tab */}
        <TabsContent value="calendar-integration">
          <GoogleCalendarIntegration />
        </TabsContent>

        {/* My Events Tab */}
        <TabsContent value="my-events">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-indigo-600" />
                My Google Calendar Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GoogleEventsSection />
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
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
