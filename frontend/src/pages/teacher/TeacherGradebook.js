import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Award, BookOpen, Users, Plus, Pencil, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TeacherGradebook = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [gradebook, setGradebook] = useState(null);
  const [exams, setExams] = useState([]);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [gradeForm, setGradeForm] = useState({});
  const [examForm, setExamForm] = useState({
    title: '',
    exam_type: 'quiz',
    date: format(new Date(), 'yyyy-MM-dd'),
    max_marks: 100,
    description: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchGradebook(selectedCourse);
      fetchExams();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`, { withCredentials: true });
      setCourses(response.data);
      if (response.data.length > 0) {
        setSelectedCourse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const fetchGradebook = async (courseId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/gradebook/${courseId}`, { withCredentials: true });
      setGradebook(response.data);
    } catch (error) {
      console.error('Error fetching gradebook:', error);
      toast.error('Failed to load gradebook');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/exams?course_id=${selectedCourse}`, { withCredentials: true });
      setExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const handleCreateExam = async () => {
    if (!examForm.title) {
      toast.error('Please enter exam title');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/exams`, {
        ...examForm,
        course_id: selectedCourse
      }, { withCredentials: true });
      toast.success('Exam created');
      setExamDialogOpen(false);
      setExamForm({
        title: '',
        exam_type: 'quiz',
        date: format(new Date(), 'yyyy-MM-dd'),
        max_marks: 100,
        description: ''
      });
      fetchExams();
      fetchGradebook(selectedCourse);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create exam');
    }
  };

  const openGradeDialog = (type, item) => {
    if (type === 'assignment') {
      setSelectedAssignment(item);
      setSelectedExam(null);
    } else {
      setSelectedExam(item);
      setSelectedAssignment(null);
    }
    
    // Initialize grade form with current grades
    const initialGrades = {};
    gradebook.students.forEach(student => {
      if (type === 'assignment' && student.assignment_marks[item.id]) {
        initialGrades[student.student_id] = {
          marks: student.assignment_marks[item.id].marks,
          feedback: student.assignment_marks[item.id].feedback || ''
        };
      } else if (type === 'exam' && student.exam_marks[item.id]) {
        initialGrades[student.student_id] = {
          marks: student.exam_marks[item.id].marks,
          remarks: student.exam_marks[item.id].remarks || ''
        };
      } else {
        initialGrades[student.student_id] = { marks: '', feedback: '', remarks: '' };
      }
    });
    setGradeForm(initialGrades);
    setGradeDialogOpen(true);
  };

  const handleSaveGrades = async () => {
    try {
      if (selectedAssignment) {
        const grades = Object.entries(gradeForm)
          .filter(([_, v]) => v.marks !== '' && v.marks !== null)
          .map(([studentId, v]) => ({
            student_id: studentId,
            marks_obtained: parseFloat(v.marks),
            feedback: v.feedback
          }));
        
        await axios.post(`${API_URL}/api/grades/bulk`, {
          assignment_id: selectedAssignment.id,
          grades
        }, { withCredentials: true });
        toast.success('Assignment grades saved');
      } else if (selectedExam) {
        const results = Object.entries(gradeForm)
          .filter(([_, v]) => v.marks !== '' && v.marks !== null)
          .map(([studentId, v]) => ({
            student_id: studentId,
            marks_obtained: parseFloat(v.marks),
            remarks: v.remarks
          }));
        
        await axios.post(`${API_URL}/api/exam-results/bulk`, {
          exam_id: selectedExam.id,
          results
        }, { withCredentials: true });
        toast.success('Exam results saved');
      }
      
      setGradeDialogOpen(false);
      fetchGradebook(selectedCourse);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save grades');
    }
  };

  const currentCourse = courses.find(c => c.id === selectedCourse);

  if (loading && !gradebook) {
    return (
      <DashboardLayout title="Gradebook">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gradebook">
      {/* Course Selector */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <Label className="mb-2 block">Select Course</Label>
          <Select value={selectedCourse || ''} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setExamDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 mt-6">
          <Plus className="w-4 h-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Stats */}
      {gradebook && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Students</p>
                  <p className="text-2xl font-bold text-slate-900">{gradebook.students.length}</p>
                </div>
                <Users className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Assignments</p>
                  <p className="text-2xl font-bold text-slate-900">{gradebook.assignments.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Exams</p>
                  <p className="text-2xl font-bold text-slate-900">{gradebook.exams.length}</p>
                </div>
                <Award className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Avg Score</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {gradebook.students.length > 0 
                      ? Math.round(gradebook.students.reduce((acc, s) => acc + s.percentage, 0) / gradebook.students.length)
                      : 0}%
                  </p>
                </div>
                <Award className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">Gradebook</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>

        {/* Gradebook Tab */}
        <TabsContent value="grades">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg">{currentCourse?.name} - Student Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-slate-50 sticky left-0 z-10">Student</TableHead>
                        {gradebook?.assignments.map(a => (
                          <TableHead key={a.id} className="bg-slate-50 text-center min-w-[100px]">
                            <div className="text-xs">{a.title}</div>
                            <div className="text-xs text-slate-400">({a.max_score})</div>
                          </TableHead>
                        ))}
                        {gradebook?.exams.map(e => (
                          <TableHead key={e.id} className="bg-purple-50 text-center min-w-[100px]">
                            <div className="text-xs">{e.title}</div>
                            <div className="text-xs text-slate-400">({e.max_marks})</div>
                          </TableHead>
                        ))}
                        <TableHead className="bg-indigo-50 text-center">Total</TableHead>
                        <TableHead className="bg-indigo-50 text-center">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradebook?.students.map(student => (
                        <TableRow key={student.student_id}>
                          <TableCell className="font-medium sticky left-0 bg-white z-10">
                            <div>{student.name}</div>
                            <div className="text-xs text-slate-400">{student.student_code}</div>
                          </TableCell>
                          {gradebook.assignments.map(a => (
                            <TableCell key={a.id} className="text-center">
                              {student.assignment_marks[a.id] ? (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                  {student.assignment_marks[a.id].marks}
                                </Badge>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                          ))}
                          {gradebook.exams.map(e => (
                            <TableCell key={e.id} className="text-center bg-purple-50/30">
                              {student.exam_marks[e.id] ? (
                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                                  {student.exam_marks[e.id].marks}
                                </Badge>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center bg-indigo-50/30 font-medium">
                            {student.total_obtained}/{student.total_max}
                          </TableCell>
                          <TableCell className="text-center bg-indigo-50/30">
                            <Badge className={`
                              ${student.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 
                                student.percentage >= 60 ? 'bg-blue-100 text-blue-800' :
                                student.percentage >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}
                            `}>
                              {student.percentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!gradebook?.students || gradebook.students.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3 + (gradebook?.assignments?.length || 0) + (gradebook?.exams?.length || 0)} className="text-center py-8 text-slate-500">
                            No students enrolled in this course
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg">Grade Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-50">Assignment</TableHead>
                    <TableHead className="bg-slate-50">Due Date</TableHead>
                    <TableHead className="bg-slate-50">Max Score</TableHead>
                    <TableHead className="bg-slate-50">Graded</TableHead>
                    <TableHead className="bg-slate-50 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradebook?.assignments.map(assignment => {
                    const graded = gradebook.students.filter(s => s.assignment_marks[assignment.id]).length;
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.title}</TableCell>
                        <TableCell>{format(new Date(assignment.due_date), 'PPP')}</TableCell>
                        <TableCell>{assignment.max_score}</TableCell>
                        <TableCell>
                          <Badge className={graded === gradebook.students.length ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                            {graded}/{gradebook.students.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openGradeDialog('assignment', assignment)}>
                            <Pencil className="w-4 h-4 mr-1" />
                            Grade
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!gradebook?.assignments || gradebook.assignments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No assignments for this course
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Exams & Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-50">Exam</TableHead>
                    <TableHead className="bg-slate-50">Type</TableHead>
                    <TableHead className="bg-slate-50">Date</TableHead>
                    <TableHead className="bg-slate-50">Max Marks</TableHead>
                    <TableHead className="bg-slate-50">Graded</TableHead>
                    <TableHead className="bg-slate-50 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradebook?.exams.map(exam => {
                    const graded = gradebook.students.filter(s => s.exam_marks[exam.id]).length;
                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.title}</TableCell>
                        <TableCell>
                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 capitalize">
                            {exam.exam_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(exam.date), 'PPP')}</TableCell>
                        <TableCell>{exam.max_marks}</TableCell>
                        <TableCell>
                          <Badge className={graded === gradebook.students.length ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                            {graded}/{gradebook.students.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openGradeDialog('exam', exam)}>
                            <Pencil className="w-4 h-4 mr-1" />
                            Grade
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!gradebook?.exams || gradebook.exams.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No exams created yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={examForm.title} onChange={(e) => setExamForm({...examForm, title: e.target.value})} placeholder="Exam title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={examForm.exam_type} onValueChange={(v) => setExamForm({...examForm, exam_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Marks</Label>
                <Input type="number" value={examForm.max_marks} onChange={(e) => setExamForm({...examForm, max_marks: parseInt(e.target.value) || 100})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={examForm.date} onChange={(e) => setExamForm({...examForm, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={examForm.description} onChange={(e) => setExamForm({...examForm, description: e.target.value})} placeholder="Optional description" rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setExamDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateExam} className="bg-indigo-600 hover:bg-indigo-700">Create Exam</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Grade {selectedAssignment?.title || selectedExam?.title}
              <span className="text-sm font-normal text-slate-500 ml-2">
                (Max: {selectedAssignment?.max_score || selectedExam?.max_marks})
              </span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4">
              {gradebook?.students.map(student => (
                <div key={student.student_id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.student_code}</p>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Marks"
                      value={gradeForm[student.student_id]?.marks || ''}
                      onChange={(e) => setGradeForm({
                        ...gradeForm,
                        [student.student_id]: {
                          ...gradeForm[student.student_id],
                          marks: e.target.value
                        }
                      })}
                      max={selectedAssignment?.max_score || selectedExam?.max_marks}
                      min={0}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder={selectedAssignment ? "Feedback" : "Remarks"}
                      value={selectedAssignment ? (gradeForm[student.student_id]?.feedback || '') : (gradeForm[student.student_id]?.remarks || '')}
                      onChange={(e) => setGradeForm({
                        ...gradeForm,
                        [student.student_id]: {
                          ...gradeForm[student.student_id],
                          [selectedAssignment ? 'feedback' : 'remarks']: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGrades} className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" />
              Save Grades
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherGradebook;
