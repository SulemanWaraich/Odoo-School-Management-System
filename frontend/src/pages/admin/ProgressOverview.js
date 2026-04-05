import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, TrendingUp } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProgressOverview = () => {
  const [progress, setProgress] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProgress();
    fetchCourses();
  }, [selectedCourse]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const params = selectedCourse ? `?course_id=${selectedCourse}` : '';
      const response = await axios.get(`${API_URL}/api/progress${params}`);
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
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

  const filteredProgress = progress.filter(record => {
    const studentName = record.student_user?.name?.toLowerCase() || '';
    return studentName.includes(search.toLowerCase());
  });

  const getScoreColor = (score) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout title="Weekly Progress Overview">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            Progress Records
          </CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-48"
                data-testid="progress-search-input"
              />
            </div>
            <Select value={selectedCourse || "all"} onValueChange={(value) => setSelectedCourse(value === "all" ? "" : value)}>
              <SelectTrigger className="w-48" data-testid="progress-course-filter">
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
                    <TableHead className="bg-slate-50">Student</TableHead>
                    <TableHead className="bg-slate-50">Course</TableHead>
                    <TableHead className="bg-slate-50">Week</TableHead>
                    <TableHead className="bg-slate-50">Score</TableHead>
                    <TableHead className="bg-slate-50">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProgress.map((record) => (
                    <TableRow key={record.id} data-testid={`progress-row-${record.id}`}>
                      <TableCell className="font-medium">{record.student_user?.name || 'Unknown'}</TableCell>
                      <TableCell>{record.course?.name || 'N/A'}</TableCell>
                      <TableCell>{record.week_start}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`w-4 h-4 ${getScoreColor(record.performance_score)}`} />
                          <span className={`font-medium ${getScoreColor(record.performance_score)}`}>
                            {record.performance_score || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{record.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {filteredProgress.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No progress records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ProgressOverview;
