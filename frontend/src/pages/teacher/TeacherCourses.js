import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BookOpen, Users } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`, { withCredentials: true });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Courses">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Courses">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="teacher-courses-grid">
        {courses.map((course) => (
          <Card key={course.id} className="dashboard-card" data-testid={`course-card-${course.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" strokeWidth={1.5} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg font-semibold mb-1" style={{ fontFamily: 'Work Sans' }}>
                {course.name}
              </CardTitle>
              <p className="text-sm text-slate-500 mb-4">{course.code} • {course.grade}</p>
              {course.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Students enrolled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No courses assigned yet. Contact admin for course assignment.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherCourses;
