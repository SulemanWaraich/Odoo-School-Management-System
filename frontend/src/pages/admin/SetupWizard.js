import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { 
  Building2, Calendar, BookOpen, Users, GraduationCap, Check, 
  ChevronRight, ChevronLeft, Upload, Plus, Trash2, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SetupWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupStatus, setSetupStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Step 1: School Profile
  const [schoolProfile, setSchoolProfile] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    principal: ''
  });

  // Step 2: Academic Terms
  const [terms, setTerms] = useState([]);
  const [newTerm, setNewTerm] = useState({ name: '', start_date: '', end_date: '', is_current: false });

  // Step 3: Courses
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [newCourse, setNewCourse] = useState({ name: '', code: '', grade: '', teacher_id: '' });

  // Step 4: Bulk Import Students
  const [studentsCsv, setStudentsCsv] = useState('');
  const [studentsPreview, setStudentsPreview] = useState([]);

  // Step 5: Bulk Import Teachers
  const [teachersCsv, setTeachersCsv] = useState('');
  const [teachersPreview, setTeachersPreview] = useState([]);

  // Step 6: Enrollments
  const [selectedCourse, setSelectedCourse] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchSetupStatus();
  }, []);

  useEffect(() => {
    if (currentStep === 2) fetchTerms();
    if (currentStep === 3) { fetchCourses(); fetchTeachers(); }
    if (currentStep === 6) { fetchCourses(); fetchStudents(); }
  }, [currentStep]);

  const fetchSetupStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/setup/status`, { withCredentials: true });
      setSetupStatus(response.data);
      if (response.data.school_profile) {
        setSchoolProfile(response.data.school_profile);
      }
    } catch (error) {
      console.error('Error fetching setup status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/academic-terms`, { withCredentials: true });
      setTerms(response.data);
    } catch (error) {
      console.error('Error fetching terms:', error);
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

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/teachers`, { withCredentials: true });
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/students`, { withCredentials: true });
      setAvailableStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Step 1: Save School Profile
  const saveSchoolProfile = async () => {
    if (!schoolProfile.name) {
      toast.error('School name is required');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/setup/school-profile`, schoolProfile, { withCredentials: true });
      toast.success('School profile saved');
      setCurrentStep(2);
    } catch (error) {
      toast.error('Failed to save school profile');
    }
  };

  // Step 2: Add Academic Term
  const addTerm = async () => {
    if (!newTerm.name || !newTerm.start_date || !newTerm.end_date) {
      toast.error('Please fill in all term fields');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/academic-terms`, newTerm, { withCredentials: true });
      toast.success('Academic term added');
      setNewTerm({ name: '', start_date: '', end_date: '', is_current: false });
      fetchTerms();
    } catch (error) {
      toast.error('Failed to add term');
    }
  };

  const deleteTerm = async (termId) => {
    try {
      await axios.delete(`${API_URL}/api/academic-terms/${termId}`, { withCredentials: true });
      toast.success('Term deleted');
      fetchTerms();
    } catch (error) {
      toast.error('Failed to delete term');
    }
  };

  // Step 3: Add Course
  const addCourse = async () => {
    if (!newCourse.name || !newCourse.code) {
      toast.error('Course name and code are required');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/courses`, newCourse, { withCredentials: true });
      toast.success('Course added');
      setNewCourse({ name: '', code: '', grade: '', teacher_id: '' });
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add course');
    }
  };

  // Step 4: Parse and Import Students
  const parseStudentsCsv = () => {
    const lines = studentsCsv.trim().split('\n');
    const students = lines.slice(1).map(line => {
      const [name, email, grade, section] = line.split(',').map(s => s.trim());
      return { name, email, grade, section, password: 'student123' };
    }).filter(s => s.name && s.email);
    setStudentsPreview(students);
  };

  const importStudents = async () => {
    if (studentsPreview.length === 0) {
      toast.error('No students to import');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/api/setup/bulk-import/students`, 
        { students: studentsPreview }, 
        { withCredentials: true }
      );
      toast.success(`Imported ${response.data.created} students`);
      if (response.data.errors.length > 0) {
        toast.error(`${response.data.errors.length} errors occurred`);
      }
      setStudentsCsv('');
      setStudentsPreview([]);
    } catch (error) {
      toast.error('Failed to import students');
    }
  };

  // Step 5: Parse and Import Teachers
  const parseTeachersCsv = () => {
    const lines = teachersCsv.trim().split('\n');
    const teachersData = lines.slice(1).map(line => {
      const [name, email, department, qualification] = line.split(',').map(s => s.trim());
      return { name, email, department, qualification, password: 'teacher123' };
    }).filter(t => t.name && t.email);
    setTeachersPreview(teachersData);
  };

  const importTeachers = async () => {
    if (teachersPreview.length === 0) {
      toast.error('No teachers to import');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/api/setup/bulk-import/teachers`, 
        { teachers: teachersPreview }, 
        { withCredentials: true }
      );
      toast.success(`Imported ${response.data.created} teachers`);
      if (response.data.errors.length > 0) {
        toast.error(`${response.data.errors.length} errors occurred`);
      }
      setTeachersCsv('');
      setTeachersPreview([]);
    } catch (error) {
      toast.error('Failed to import teachers');
    }
  };

  // Step 6: Bulk Enroll
  const bulkEnroll = async () => {
    if (!selectedCourse || selectedStudents.length === 0) {
      toast.error('Select a course and at least one student');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/api/setup/bulk-enroll`, 
        { course_id: selectedCourse, student_ids: selectedStudents }, 
        { withCredentials: true }
      );
      toast.success(`Enrolled ${response.data.enrolled} students`);
      setSelectedStudents([]);
    } catch (error) {
      toast.error('Failed to enroll students');
    }
  };

  const steps = [
    { num: 1, title: 'School Profile', icon: Building2 },
    { num: 2, title: 'Academic Terms', icon: Calendar },
    { num: 3, title: 'Courses', icon: BookOpen },
    { num: 4, title: 'Import Students', icon: Users },
    { num: 5, title: 'Import Teachers', icon: GraduationCap },
    { num: 6, title: 'Enrollments', icon: CheckCircle },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Setup Wizard">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Setup Wizard">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <React.Fragment key={step.num}>
              <div 
                className={`flex flex-col items-center cursor-pointer ${currentStep >= step.num ? 'text-indigo-600' : 'text-slate-400'}`}
                onClick={() => setCurrentStep(step.num)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  currentStep > step.num ? 'bg-indigo-600 text-white' : 
                  currentStep === step.num ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' : 
                  'bg-slate-100 text-slate-400'
                }`}>
                  {currentStep > step.num ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className="text-xs font-medium hidden md:block">{step.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${currentStep > step.num ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="dashboard-card">
        {/* Step 1: School Profile */}
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                School Profile
              </CardTitle>
              <CardDescription>Enter your school's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input
                    id="schoolName"
                    value={schoolProfile.name}
                    onChange={(e) => setSchoolProfile({...schoolProfile, name: e.target.value})}
                    placeholder="Springfield High School"
                    data-testid="school-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principal">Principal Name</Label>
                  <Input
                    id="principal"
                    value={schoolProfile.principal}
                    onChange={(e) => setSchoolProfile({...schoolProfile, principal: e.target.value})}
                    placeholder="Dr. John Smith"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={schoolProfile.address}
                  onChange={(e) => setSchoolProfile({...schoolProfile, address: e.target.value})}
                  placeholder="123 Education Street, City, State 12345"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={schoolProfile.phone}
                    onChange={(e) => setSchoolProfile({...schoolProfile, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">Email</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    value={schoolProfile.email}
                    onChange={(e) => setSchoolProfile({...schoolProfile, email: e.target.value})}
                    placeholder="contact@school.edu"
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Academic Terms */}
        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Academic Terms
              </CardTitle>
              <CardDescription>Add academic years and semesters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="space-y-2">
                  <Label>Term Name</Label>
                  <Input
                    value={newTerm.name}
                    onChange={(e) => setNewTerm({...newTerm, name: e.target.value})}
                    placeholder="Fall 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newTerm.start_date}
                    onChange={(e) => setNewTerm({...newTerm, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newTerm.end_date}
                    onChange={(e) => setNewTerm({...newTerm, end_date: e.target.value})}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isCurrent"
                      checked={newTerm.is_current}
                      onCheckedChange={(checked) => setNewTerm({...newTerm, is_current: checked})}
                    />
                    <Label htmlFor="isCurrent" className="text-sm">Current</Label>
                  </div>
                  <Button onClick={addTerm} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {terms.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terms.map((term) => (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{term.name}</TableCell>
                        <TableCell>{term.start_date}</TableCell>
                        <TableCell>{term.end_date}</TableCell>
                        <TableCell>
                          {term.is_current ? (
                            <Badge className="bg-emerald-100 text-emerald-800">Current</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => deleteTerm(term.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </>
        )}

        {/* Step 3: Courses */}
        {currentStep === 3 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Courses
              </CardTitle>
              <CardDescription>Create courses and assign teachers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="space-y-2">
                  <Label>Course Name</Label>
                  <Input
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                    placeholder="Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                    placeholder="MATH101"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Input
                    value={newCourse.grade}
                    onChange={(e) => setNewCourse({...newCourse, grade: e.target.value})}
                    placeholder="Grade 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select value={newCourse.teacher_id || "none"} onValueChange={(v) => setNewCourse({...newCourse, teacher_id: v === "none" ? "" : v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.user?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={addCourse} className="bg-indigo-600 hover:bg-indigo-700 w-full">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {courses.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.grade || '-'}</TableCell>
                        <TableCell>{course.teacher_user?.name || 'Not assigned'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </>
        )}

        {/* Step 4: Import Students */}
        {currentStep === 4 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Bulk Import Students
              </CardTitle>
              <CardDescription>Import students from CSV format (name, email, grade, section)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">Format: name, email, grade, section (one per line)</p>
                <p className="text-xs text-slate-500 mb-3">Example: John Doe, john@school.com, Grade 10, A</p>
                <Textarea
                  value={studentsCsv}
                  onChange={(e) => setStudentsCsv(e.target.value)}
                  placeholder="name, email, grade, section
John Doe, john@school.com, Grade 10, A
Jane Smith, jane@school.com, Grade 10, B"
                  rows={6}
                  className="font-mono text-sm"
                  data-testid="students-csv-input"
                />
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" onClick={parseStudentsCsv}>
                    Preview
                  </Button>
                  <Button onClick={importStudents} className="bg-indigo-600 hover:bg-indigo-700" disabled={studentsPreview.length === 0}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {studentsPreview.length} Students
                  </Button>
                </div>
              </div>

              {studentsPreview.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Section</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsPreview.map((s, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.grade}</TableCell>
                        <TableCell>{s.section}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </>
        )}

        {/* Step 5: Import Teachers */}
        {currentStep === 5 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Bulk Import Teachers
              </CardTitle>
              <CardDescription>Import teachers from CSV format (name, email, department, qualification)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">Format: name, email, department, qualification</p>
                <p className="text-xs text-slate-500 mb-3">Example: Dr. Smith, smith@school.com, Mathematics, Ph.D.</p>
                <Textarea
                  value={teachersCsv}
                  onChange={(e) => setTeachersCsv(e.target.value)}
                  placeholder="name, email, department, qualification
Dr. Smith, smith@school.com, Mathematics, Ph.D.
Ms. Johnson, johnson@school.com, English, M.A."
                  rows={6}
                  className="font-mono text-sm"
                  data-testid="teachers-csv-input"
                />
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" onClick={parseTeachersCsv}>
                    Preview
                  </Button>
                  <Button onClick={importTeachers} className="bg-indigo-600 hover:bg-indigo-700" disabled={teachersPreview.length === 0}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {teachersPreview.length} Teachers
                  </Button>
                </div>
              </div>

              {teachersPreview.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Qualification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachersPreview.map((t, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{t.name}</TableCell>
                        <TableCell>{t.email}</TableCell>
                        <TableCell>{t.department}</TableCell>
                        <TableCell>{t.qualification}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </>
        )}

        {/* Step 6: Enrollments */}
        {currentStep === 6 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                Bulk Enrollments
              </CardTitle>
              <CardDescription>Enroll multiple students in a course at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Course</Label>
                    <Select value={selectedCourse || "none"} onValueChange={(v) => setSelectedCourse(v === "none" ? "" : v)}>
                      <SelectTrigger data-testid="enroll-course-select">
                        <SelectValue placeholder="Choose a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select course</SelectItem>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={bulkEnroll} className="bg-indigo-600 hover:bg-indigo-700" disabled={selectedStudents.length === 0}>
                      Enroll {selectedStudents.length} Students
                    </Button>
                  </div>
                </div>
              </div>

              {availableStudents.length > 0 && (
                <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                  <p className="text-sm text-slate-600 mb-3">Select students to enroll:</p>
                  <div className="space-y-2">
                    {availableStudents.map((student) => (
                      <div key={student.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                        <Checkbox
                          id={student.id}
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <Label htmlFor={student.id} className="flex-1 cursor-pointer">
                          <span className="font-medium">{student.user?.name}</span>
                          <span className="text-slate-500 text-sm ml-2">
                            {student.grade} {student.section && `- ${student.section}`}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between p-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin')}>
              Skip to Dashboard
            </Button>
            {currentStep < 6 ? (
              <Button 
                onClick={() => {
                  if (currentStep === 1) saveSchoolProfile();
                  else setCurrentStep(currentStep + 1);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {currentStep === 1 ? 'Save & Continue' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => navigate('/admin')} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-4 h-4 mr-1" />
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default SetupWizard;
