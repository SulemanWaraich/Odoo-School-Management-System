import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TeacherAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendance, setAttendance] = useState({});
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrolledStudents();
      fetchExistingAttendance();
    }
  }, [selectedCourse, selectedDate]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`, { withCredentials: true });
      setCourses(response.data);
      if (response.data.length > 0) {
        setSelectedCourse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const enrollResponse = await axios.get(`${API_URL}/api/enrollments?course_id=${selectedCourse}`, { withCredentials: true });
      const studentIds = enrollResponse.data.map(e => e.student_id);
      
      const studentsResponse = await axios.get(`${API_URL}/api/students`, { withCredentials: true });
      const enrolledStudents = studentsResponse.data.filter(s => studentIds.includes(s.id));
      setStudents(enrolledStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await axios.get(`${API_URL}/api/attendance?course_id=${selectedCourse}&date=${dateStr}`, { withCredentials: true });
      setExistingAttendance(response.data);
      
      // Pre-fill attendance
      const attendanceMap = {};
      response.data.forEach(record => {
        attendanceMap[record.student_id] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId,
      status: status
    }));

    if (records.length === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/attendance/bulk`, {
        course_id: selectedCourse,
        date: format(selectedDate, 'yyyy-MM-dd'),
        records: records
      }, { withCredentials: true });
      toast.success('Attendance saved successfully');
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Mark Attendance">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mark Attendance">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            Daily Attendance
          </CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-48" data-testid="attendance-course-select">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-48" data-testid="attendance-date-picker">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button 
              onClick={handleSaveAttendance} 
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="save-attendance-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-50">Student ID</TableHead>
                    <TableHead className="bg-slate-50">Name</TableHead>
                    <TableHead className="bg-slate-50">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} data-testid={`attendance-row-${student.id}`}>
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.user?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Select
                          value={attendance[student.id] || ''}
                          onValueChange={(value) => handleStatusChange(student.id, value)}
                        >
                          <SelectTrigger className="w-32" data-testid={`status-select-${student.id}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-8 text-slate-500">
              {selectedCourse ? 'No students enrolled in this course' : 'Please select a course'}
            </p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default TeacherAttendance;
