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
import { FileSpreadsheet, Download, Eye, Search, GraduationCap, Users } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ReportCards = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportCard, setReportCard] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, gradeFilter]);

  const fetchData = async () => {
    try {
      const [studentsRes, termsRes] = await Promise.all([
        axios.get(`${API_URL}/api/students`),
        axios.get(`${API_URL}/api/academic-terms`)
      ]);
      setStudents(studentsRes.data);
      setFilteredStudents(studentsRes.data);
      setTerms(termsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(s => s.grade === gradeFilter);
    }
    setFilteredStudents(filtered);
  };

  const fetchReportCard = async (studentId) => {
    try {
      setLoading(true);
      const url = selectedTerm 
        ? `${API_URL}/api/report-card/${studentId}?term_id=${selectedTerm}`
        : `${API_URL}/api/report-card/${studentId}`;
      const response = await axios.get(url);
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
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">${s.course_code}</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">${s.marks_obtained}</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">${s.marks_max}</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">${s.percentage}%</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">${s.grade_letter}</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">${s.attendance_percentage}%</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Card - ${rc.student.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #1E293B; }
          .header { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
          .school-name { font-size: 28px; font-weight: bold; color: #4F46E5; margin-bottom: 5px; }
          .report-title { font-size: 20px; color: #64748B; margin: 10px 0; }
          .student-info { display: flex; justify-content: space-between; margin: 20px 0; padding: 20px; background: #F8FAFC; border-radius: 8px; }
          .info-group { }
          .info-label { color: #64748B; font-size: 12px; text-transform: uppercase; }
          .info-value { font-weight: 600; font-size: 14px; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #4F46E5; color: white; padding: 12px; text-align: left; }
          .summary-section { display: flex; gap: 20px; margin: 30px 0; }
          .summary-box { flex: 1; text-align: center; padding: 20px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; }
          .summary-label { font-size: 12px; color: #64748B; text-transform: uppercase; }
          .summary-value { font-size: 32px; font-weight: bold; color: #4F46E5; margin: 10px 0; }
          .remarks-box { padding: 20px; background: #FEF3C7; border-left: 4px solid #F59E0B; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .result-box { text-align: center; padding: 20px; margin: 20px 0; }
          .result-pass { color: #059669; font-size: 24px; font-weight: bold; }
          .result-fail { color: #DC2626; font-size: 24px; font-weight: bold; }
          .footer { text-align: center; margin-top: 50px; color: #64748B; font-size: 12px; border-top: 1px solid #E2E8F0; padding-top: 20px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">${rc.school?.name || 'SchoolHub Academy'}</div>
          <div style="color: #64748B;">${rc.school?.address || ''}</div>
          <div class="report-title">STUDENT REPORT CARD</div>
          <div style="color: #64748B;">${rc.term?.name || 'Academic Year 2024-25'}</div>
        </div>
        
        <div class="student-info">
          <div class="info-group">
            <div class="info-label">Student Name</div>
            <div class="info-value">${rc.student.name}</div>
            <div class="info-label" style="margin-top: 15px;">Student ID</div>
            <div class="info-value">${rc.student.student_id}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Class</div>
            <div class="info-value">${rc.student.grade} - ${rc.student.section || 'N/A'}</div>
            <div class="info-label" style="margin-top: 15px;">Email</div>
            <div class="info-value">${rc.student.email}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Report Date</div>
            <div class="info-value">${new Date(rc.generated_at).toLocaleDateString()}</div>
            <div class="info-label" style="margin-top: 15px;">Rank</div>
            <div class="info-value">${rc.academic_summary.rank || 'N/A'} / ${rc.academic_summary.total_students}</div>
          </div>
        </div>
        
        <h3 style="color: #1E293B; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px;">Subject-wise Performance</h3>
        <table>
          <tr>
            <th>Subject</th>
            <th style="text-align: center;">Code</th>
            <th style="text-align: center;">Marks Obtained</th>
            <th style="text-align: center;">Max Marks</th>
            <th style="text-align: center;">Percentage</th>
            <th style="text-align: center;">Grade</th>
            <th style="text-align: center;">Attendance</th>
          </tr>
          ${subjectsRows}
        </table>
        
        <div class="summary-section">
          <div class="summary-box">
            <div class="summary-label">Total Marks</div>
            <div class="summary-value">${rc.academic_summary.total_obtained}/${rc.academic_summary.total_max}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Percentage</div>
            <div class="summary-value">${rc.academic_summary.percentage}%</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Grade</div>
            <div class="summary-value">${rc.academic_summary.grade_letter}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">GPA</div>
            <div class="summary-value">${rc.academic_summary.gpa}</div>
          </div>
        </div>
        
        <h3 style="color: #1E293B; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px;">Attendance Summary</h3>
        <p>Total Days: ${rc.attendance_summary.total_days} | Present: ${rc.attendance_summary.present} | Absent: ${rc.attendance_summary.absent} | Late: ${rc.attendance_summary.late} | <strong>Attendance: ${rc.attendance_summary.percentage}%</strong></p>
        
        <div class="remarks-box">
          <strong>Teacher's Remarks:</strong><br/>
          ${rc.remarks}
        </div>
        
        <div class="result-box">
          <span class="${rc.academic_summary.status === 'Pass' ? 'result-pass' : 'result-fail'}">
            Result: ${rc.academic_summary.status.toUpperCase()}
          </span>
        </div>
        
        <div class="footer">
          <p>This is a computer-generated report card.</p>
          <p>Generated on ${new Date(rc.generated_at).toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  const grades = [...new Set(students.map(s => s.grade).filter(Boolean))];

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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-2xl font-bold text-slate-900">{students.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Term</p>
                <p className="text-lg font-bold text-slate-900">{terms.find(t => t.is_current)?.name || 'Not Set'}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Report Cards</p>
                <p className="text-2xl font-bold text-slate-900">Ready</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-lg">Generate Report Cards</CardTitle>
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
            <div className="w-40">
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Term</SelectItem>
                  {terms.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
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
                <TableHead className="bg-slate-50">Email</TableHead>
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
                  <TableCell className="text-slate-500">{student.user?.email || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fetchReportCard(student.id)}
                      className="mr-2"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No students found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Card Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Report Card Preview</DialogTitle>
              <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 mr-2" />
                Print / Download
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            {reportCard && (
              <div className="p-6 bg-white">
                {/* Header */}
                <div className="text-center border-b-2 border-indigo-600 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-indigo-600">{reportCard.school?.name || 'SchoolHub Academy'}</h1>
                  <p className="text-slate-500">{reportCard.school?.address}</p>
                  <h2 className="text-xl mt-2">STUDENT REPORT CARD</h2>
                  <p className="text-slate-500">{reportCard.term?.name || 'Academic Year 2024-25'}</p>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg mb-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Student Name</p>
                    <p className="font-semibold">{reportCard.student.name}</p>
                    <p className="text-xs text-slate-500 uppercase mt-2">Student ID</p>
                    <p className="font-semibold">{reportCard.student.student_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Class</p>
                    <p className="font-semibold">{reportCard.student.grade} - {reportCard.student.section || 'N/A'}</p>
                    <p className="text-xs text-slate-500 uppercase mt-2">Email</p>
                    <p className="font-semibold text-sm">{reportCard.student.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Rank</p>
                    <p className="font-semibold">{reportCard.academic_summary.rank || 'N/A'} / {reportCard.academic_summary.total_students}</p>
                    <p className="text-xs text-slate-500 uppercase mt-2">Report Date</p>
                    <p className="font-semibold">{new Date(reportCard.generated_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Subjects Table */}
                <h3 className="font-semibold mb-3 border-b pb-2">Subject-wise Performance</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Code</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Max</TableHead>
                      <TableHead className="text-center">%</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportCard.subjects.map((subj, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{subj.course_name}</TableCell>
                        <TableCell className="text-center">{subj.course_code}</TableCell>
                        <TableCell className="text-center">{subj.marks_obtained}</TableCell>
                        <TableCell className="text-center">{subj.marks_max}</TableCell>
                        <TableCell className="text-center">{subj.percentage}%</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`
                            ${subj.grade_letter.startsWith('A') ? 'bg-emerald-100 text-emerald-800' : 
                              subj.grade_letter.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                              subj.grade_letter === 'F' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}
                          `}>
                            {subj.grade_letter}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{subj.attendance_percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Summary */}
                <div className="grid grid-cols-4 gap-4 my-6">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase">Total Marks</p>
                    <p className="text-2xl font-bold text-indigo-600">{reportCard.academic_summary.total_obtained}/{reportCard.academic_summary.total_max}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase">Percentage</p>
                    <p className="text-2xl font-bold text-indigo-600">{reportCard.academic_summary.percentage}%</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase">Grade</p>
                    <p className="text-2xl font-bold text-indigo-600">{reportCard.academic_summary.grade_letter}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase">GPA</p>
                    <p className="text-2xl font-bold text-indigo-600">{reportCard.academic_summary.gpa}</p>
                  </div>
                </div>

                {/* Attendance */}
                <div className="p-4 bg-slate-50 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2">Attendance Summary</h4>
                  <p className="text-sm">
                    Total Days: {reportCard.attendance_summary.total_days} | 
                    Present: {reportCard.attendance_summary.present} | 
                    Absent: {reportCard.attendance_summary.absent} | 
                    Late: {reportCard.attendance_summary.late} | 
                    <span className="font-semibold"> Attendance: {reportCard.attendance_summary.percentage}%</span>
                  </p>
                </div>

                {/* Remarks */}
                <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg mb-4">
                  <h4 className="font-semibold mb-1">Teacher's Remarks</h4>
                  <p className="text-sm text-slate-700">{reportCard.remarks}</p>
                </div>

                {/* Result */}
                <div className="text-center py-4">
                  <span className={`text-2xl font-bold ${reportCard.academic_summary.status === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                    Result: {reportCard.academic_summary.status.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReportCards;
