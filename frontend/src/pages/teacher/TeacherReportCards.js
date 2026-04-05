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
import { ScrollArea } from '../../components/ui/scroll-area';
import { FileSpreadsheet, Download, Eye, Search, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TeacherReportCards = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [reportCard, setReportCard] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, selectedCourse, searchTerm]);

  const fetchData = async () => {
    try {
      const [coursesRes, studentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/courses`, { withCredentials: true }),
        axios.get(`${API_URL}/api/students`, { withCredentials: true })
      ]);
      setCourses(coursesRes.data);
      
      // Get students from all courses this teacher teaches
      const courseIds = coursesRes.data.map(c => c.id);
      const enrollmentsRes = await axios.get(`${API_URL}/api/enrollments`, { withCredentials: true });
      const enrolledStudentIds = new Set(
        enrollmentsRes.data
          .filter(e => courseIds.includes(e.course_id))
          .map(e => e.student_id)
      );
      
      const myStudents = studentsRes.data.filter(s => enrolledStudentIds.has(s.id));
      setStudents(myStudents);
      setFilteredStudents(myStudents);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = async () => {
    let filtered = students;
    
    if (selectedCourse !== 'all') {
      try {
        const enrollmentsRes = await axios.get(`${API_URL}/api/enrollments?course_id=${selectedCourse}`, { withCredentials: true });
        const enrolledIds = enrollmentsRes.data.map(e => e.student_id);
        filtered = students.filter(s => enrolledIds.includes(s.id));
      } catch (error) {
        console.error('Error filtering:', error);
      }
    }
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredStudents(filtered);
  };

  const fetchReportCard = async (studentId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/report-card/${studentId}`, { withCredentials: true });
      setReportCard(response.data);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error fetching report card:', error);
      toast.error('Failed to generate report card');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Similar to admin implementation
    const printWindow = window.open('', '_blank');
    if (printWindow && reportCard) {
      printWindow.document.write(generateReportCardHTML(reportCard));
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateReportCardHTML = (rc) => {
    const subjectsRows = rc.subjects.map(s => `
      <tr>
        <td style="padding: 10px; border: 1px solid #E2E8F0;">${s.course_name}</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">${s.marks_obtained}</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">${s.marks_max}</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">${s.percentage}%</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">${s.grade_letter}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Card - ${rc.student.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #4F46E5; color: white; padding: 12px; }
          .summary { display: flex; justify-content: space-around; margin: 30px 0; }
          .summary-box { text-align: center; padding: 20px; background: #F8FAFC; border-radius: 8px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #4F46E5;">${rc.school?.name || 'SchoolHub Academy'}</h1>
          <h2>STUDENT REPORT CARD</h2>
        </div>
        <div style="margin: 20px 0; padding: 20px; background: #F8FAFC;">
          <p><strong>Student:</strong> ${rc.student.name} | <strong>ID:</strong> ${rc.student.student_id} | <strong>Class:</strong> ${rc.student.grade}</p>
        </div>
        <table>
          <tr>
            <th>Subject</th>
            <th>Marks</th>
            <th>Max</th>
            <th>%</th>
            <th>Grade</th>
          </tr>
          ${subjectsRows}
        </table>
        <div class="summary">
          <div class="summary-box">
            <p>Total: ${rc.academic_summary.total_obtained}/${rc.academic_summary.total_max}</p>
          </div>
          <div class="summary-box">
            <p>Percentage: ${rc.academic_summary.percentage}%</p>
          </div>
          <div class="summary-box">
            <p>Grade: ${rc.academic_summary.grade_letter}</p>
          </div>
          <div class="summary-box">
            <p>Result: ${rc.academic_summary.status}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  if (loading && !reportCard) {
    return (
      <DashboardLayout title="Report Cards">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Report Cards">
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Generate Report Cards for My Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search by name or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Students Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-slate-50">Student ID</TableHead>
                <TableHead className="bg-slate-50">Name</TableHead>
                <TableHead className="bg-slate-50">Grade</TableHead>
                <TableHead className="bg-slate-50">Section</TableHead>
                <TableHead className="bg-slate-50 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-sm">{student.student_id}</TableCell>
                  <TableCell className="font-medium">{student.user?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                      {student.grade || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.section || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fetchReportCard(student.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No students found in your courses
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Card Preview Dialog - Similar to Admin */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Report Card Preview</DialogTitle>
              <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            {reportCard && (
              <div className="p-6 bg-white">
                <div className="text-center border-b-2 border-indigo-600 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-indigo-600">{reportCard.school?.name || 'SchoolHub Academy'}</h1>
                  <h2 className="text-xl mt-2">STUDENT REPORT CARD</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg mb-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Student Name</p>
                    <p className="font-semibold">{reportCard.student.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Student ID</p>
                    <p className="font-semibold">{reportCard.student.student_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Class</p>
                    <p className="font-semibold">{reportCard.student.grade} - {reportCard.student.section || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Rank</p>
                    <p className="font-semibold">{reportCard.academic_summary.rank || 'N/A'} / {reportCard.academic_summary.total_students}</p>
                  </div>
                </div>

                <h3 className="font-semibold mb-3 border-b pb-2">Subject-wise Performance</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Max</TableHead>
                      <TableHead className="text-center">%</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportCard.subjects.map((subj, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{subj.course_name}</TableCell>
                        <TableCell className="text-center">{subj.marks_obtained}</TableCell>
                        <TableCell className="text-center">{subj.marks_max}</TableCell>
                        <TableCell className="text-center">{subj.percentage}%</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`
                            ${subj.grade_letter.startsWith('A') ? 'bg-emerald-100 text-emerald-800' : 
                              subj.grade_letter === 'F' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}
                          `}>
                            {subj.grade_letter}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="grid grid-cols-4 gap-4 my-6">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-xl font-bold text-indigo-600">{reportCard.academic_summary.total_obtained}/{reportCard.academic_summary.total_max}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Percentage</p>
                    <p className="text-xl font-bold text-indigo-600">{reportCard.academic_summary.percentage}%</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Grade</p>
                    <p className="text-xl font-bold text-indigo-600">{reportCard.academic_summary.grade_letter}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Result</p>
                    <p className={`text-xl font-bold ${reportCard.academic_summary.status === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {reportCard.academic_summary.status}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                  <h4 className="font-semibold mb-1">Teacher's Remarks</h4>
                  <p className="text-sm text-slate-700">{reportCard.remarks}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherReportCards;
