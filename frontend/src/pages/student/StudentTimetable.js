import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Clock, MapPin, BookOpen, Calendar } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const StudentTimetable = () => {
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
      const todayIndex = today === 0 ? 6 : today - 1;
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

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return todayClasses.find(c => c.start_time <= currentTime && c.end_time > currentTime);
  };

  const currentClass = getCurrentTimeSlot();
  const upcomingClasses = todayClasses.filter(c => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return c.start_time > currentTime;
  });

  if (loading) {
    return (
      <DashboardLayout title="Class Schedule">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Class Schedule">
      {/* Current/Next Class */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {currentClass ? (
          <Card className="dashboard-card border-2 border-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Current Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="text-xl font-bold text-indigo-900">{currentClass.course?.name}</h3>
                <p className="text-indigo-600">{currentClass.course?.code}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-indigo-700">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentClass.start_time} - {currentClass.end_time}
                  </span>
                  {currentClass.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {currentClass.room}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-indigo-600">
                  Teacher: {currentClass.teacher_user?.name || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Current Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No class in session</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Upcoming Today</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length > 0 ? (
              <div className="space-y-2">
                {upcomingClasses.slice(0, 3).map((cls, idx) => (
                  <div key={cls.id} className={`p-3 rounded-lg border ${getColorForIndex(idx)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cls.course?.name}</p>
                        <p className="text-xs opacity-75">{cls.teacher_user?.name}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{cls.start_time}</p>
                        {cls.room && <p className="text-xs opacity-75">{cls.room}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No more classes today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Full Schedule */}
      <Card className="dashboard-card mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Today's Schedule - {DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {todayClasses.map((entry, idx) => {
                const isCurrent = currentClass?.id === entry.id;
                return (
                  <div 
                    key={entry.id} 
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCurrent 
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg' 
                        : `${getColorForIndex(idx)}`
                    }`}
                  >
                    {isCurrent && (
                      <Badge className="bg-green-500 text-white mb-2">In Progress</Badge>
                    )}
                    <h3 className="font-semibold">{entry.course?.name || 'N/A'}</h3>
                    <Badge variant="outline" className="mt-1">{entry.course?.code}</Badge>
                    <div className="flex items-center gap-2 text-sm mt-3 opacity-75">
                      <Clock className="w-4 h-4" />
                      {entry.start_time} - {entry.end_time}
                    </div>
                    {entry.room && (
                      <div className="flex items-center gap-2 text-sm opacity-75">
                        <MapPin className="w-4 h-4" />
                        {entry.room}
                      </div>
                    )}
                    <p className="text-sm mt-2 opacity-75">
                      {entry.teacher_user?.name || 'N/A'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No classes scheduled for today</p>
              <p className="text-sm">Enjoy your free day!</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {DAYS.slice(0, 6).map((day, dayIdx) => {
              const today = new Date().getDay();
              const todayIndex = today === 0 ? 6 : today - 1;
              const isToday = dayIdx === todayIndex;
              
              return (
                <div 
                  key={day} 
                  className={`border rounded-lg overflow-hidden ${isToday ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}
                >
                  <div className={`px-4 py-2 border-b ${isToday ? 'bg-indigo-100' : 'bg-slate-50'}`}>
                    <h3 className={`font-semibold ${isToday ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {day}
                      {isToday && <span className="ml-2 text-xs bg-indigo-500 text-white px-2 py-0.5 rounded">Today</span>}
                    </h3>
                  </div>
                  <div className="p-3 space-y-2 min-h-[150px]">
                    {(weekly[dayIdx] || []).length > 0 ? (
                      (weekly[dayIdx] || []).map((entry, idx) => (
                        <div key={entry.id} className={`p-2 rounded text-sm border ${getColorForIndex(idx)}`}>
                          <div className="font-medium truncate">{entry.course?.name}</div>
                          <div className="text-xs opacity-75">
                            {entry.start_time} - {entry.end_time}
                          </div>
                          {entry.room && (
                            <div className="text-xs opacity-75">{entry.room}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-sm">
                        No classes
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentTimetable;
