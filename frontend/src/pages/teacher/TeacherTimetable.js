import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import GoogleCalendarIntegration from '../../components/GoogleCalendarIntegration';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Clock, MapPin, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TeacherTimetable = () => {
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState({});
  const [todayClasses, setTodayClasses] = useState([]);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/timetable/weekly`);
      setWeekly(response.data);
      
      // Get today's classes
      const today = new Date().getDay();
      const todayIndex = today === 0 ? 6 : today - 1; // Convert JS day (0=Sun) to our format (0=Mon)
      setTodayClasses(response.data[todayIndex] || []);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorForIndex = (idx) => {
    const colors = [
      'bg-indigo-100 border-indigo-300 text-indigo-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-emerald-100 border-emerald-300 text-emerald-800',
      'bg-amber-100 border-amber-300 text-amber-800',
      'bg-rose-100 border-rose-300 text-rose-800'
    ];
    return colors[idx % colors.length];
  };

  if (loading) {
    return (
      <DashboardLayout title="My Schedule">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Schedule">
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">My Schedule</TabsTrigger>
          <TabsTrigger value="calendar">Google Calendar</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          {/* Today's Classes */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Today's Classes - {DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todayClasses.map((entry, idx) => (
                    <div key={entry.id} className={`p-4 rounded-lg border-2 ${getColorForIndex(idx)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{entry.course?.name || 'N/A'}</h3>
                        <Badge variant="outline">{entry.course?.code}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-75 mb-1">
                        <Clock className="w-4 h-4" />
                        {entry.start_time} - {entry.end_time}
                      </div>
                      {entry.room && (
                        <div className="flex items-center gap-2 text-sm opacity-75">
                          <MapPin className="w-4 h-4" />
                          {entry.room}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No classes scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {DAYS.slice(0, 6).map((day, dayIdx) => (
                  <div key={day} className="border rounded-lg overflow-hidden">
                    <div className="bg-indigo-50 px-4 py-2 border-b">
                      <h3 className="font-semibold text-indigo-900">{day}</h3>
                    </div>
                    <div className="p-3 space-y-2 min-h-[200px]">
                      {(weekly[dayIdx] || []).length > 0 ? (
                        (weekly[dayIdx] || []).map((entry, idx) => (
                          <div key={entry.id} className={`p-3 rounded border ${getColorForIndex(idx)}`}>
                            <div className="font-medium text-sm truncate">{entry.course?.name}</div>
                            <div className="text-xs opacity-75 mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {entry.start_time} - {entry.end_time}
                            </div>
                            {entry.room && (
                              <div className="text-xs opacity-75">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {entry.room}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          No classes
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Calendar Tab */}
        <TabsContent value="calendar">
          <GoogleCalendarIntegration />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default TeacherTimetable;
