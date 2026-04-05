import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { FileSpreadsheet, Download, Award, TrendingUp, Target, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StudentReportCard = () => {
  const [loading, setLoading] = useState(true);
  const [reportCard, setReportCard] = useState(null);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    fetchStudentInfo();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      // First get student info
      const meRes = await axios.get(`${API_URL}/api/auth/me`);
      const statsRes = await axios.get(`${API_URL}/api/stats/student`);
      setStudentId(statsRes.data.student?.id);
      
      if (statsRes.data.student?.id) {
        fetchReportCard(statsRes.data.student.id);
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
      toast.error('Failed to load student info');
      setLoading(false);
    }
  };

  const fetchReportCard = async (sid) => {
    try {
      const response = await axios.get(`${API_URL}/api/report-card/${sid}`);
      setReportCard(response.data);
    } catch (error) {
      console.error('Error fetching report card:', error);
      toast.error('Failed to load report card');
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
        <td style="padding: 12px; border: 1px solid #E2E8F0;">${s.course_name}</td>
        <td style="padding: 12px; border: 1px solid #E2E8F0; text-align: center;">${s.course_code}</td>
        <td style="padding: 12px; border: 1px solid #E2E8F0; text-align: center;">${s.marks_obtained}</td>
        <td style="padding: 12px; border: 1px solid #E2E8F0; text-align: center;">${s.marks_max}</td>
        <td style="padding: 12px; border: 1px solid #E2E8F0; text-align: center;">${s.percentage}%</td>
        <td style="padding: 12px; border: 1px solid #E2E8F0; text-align: center;">${s.grade_letter}</td>
        <td style="padding: 12px; border: 1px solid #E2E8F0; text-align: center;">${s.attendance_percentage}%</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Card - ${rc.student.name}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1E293B; line-height: 1.6; }
          .header { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 25px; margin-bottom: 30px; }
          .school-name { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 1px; }
          .subtitle { color: #64748B; font-size: 14px; margin-top: 5px; }
          .report-title { font-size: 22px; margin: 15px 0 10px; text-transform: uppercase; letter-spacing: 2px; }
          .student-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 25px; background: linear-gradient(135deg, #F8FAFC, #EEF2FF); border-radius: 12px; margin-bottom: 30px; }
          .info-group { }
          .info-label { color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
          .info-value { font-weight: 600; font-size: 15px; color: #1E293B; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px; }
          th { background: linear-gradient(135deg, #4F46E5, #6366F1); color: white; padding: 14px; text-align: left; font-weight: 600; }
          th:first-child { border-radius: 8px 0 0 0; }
          th:last-child { border-radius: 0 8px 0 0; }
          .summary-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 35px 0; }
          .summary-box { text-align: center; padding: 25px 15px; background: linear-gradient(135deg, #F8FAFC, #EEF2FF); border-radius: 12px; border: 1px solid #E2E8F0; }
          .summary-label { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .summary-value { font-size: 36px; font-weight: bold; color: #4F46E5; }
          .remarks-box { padding: 25px; background: linear-gradient(135deg, #FEF3C7, #FDE68A); border-left: 5px solid #F59E0B; margin: 30px 0; border-radius: 0 12px 12px 0; }
          .remarks-title { font-weight: 600; color: #92400E; margin-bottom: 8px; }
          .result-box { text-align: center; padding: 30px; margin: 30px 0; }
          .result-pass { color: #059669; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; }
          .result-fail { color: #DC2626; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; }
          .attendance-box { padding: 20px; background: #F8FAFC; border-radius: 12px; margin: 25px 0; }
          .footer { text-align: center; margin-top: 50px; color: #64748B; font-size: 11px; border-top: 1px solid #E2E8F0; padding-top: 25px; }
          @media print { 
            body { margin: 20px; } 
            .summary-box { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">${rc.school?.name || 'SchoolHub Academy'}</div>
          <div class="subtitle">${rc.school?.address || 'Excellence in Education'}</div>
          <div class="report-title">Student Report Card</div>
          <div class="subtitle">${rc.term?.name || 'Academic Year 2024-25'}</div>
        </div>
        
        <div class="student-info">
          <div class="info-group">
            <div class="info-label">Student Name</div>
            <div class="info-value">${rc.student.name}</div>
            <div class="info-label" style="margin-top: 15px;">Student ID</div>
            <div class="info-value">${rc.student.student_id}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Class / Section</div>
            <div class="info-value">${rc.student.grade} - ${rc.student.section || 'N/A'}</div>
            <div class="info-label" style="margin-top: 15px;">Email</div>
            <div class="info-value" style="font-size: 13px;">${rc.student.email}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Class Rank</div>
            <div class="info-value">${rc.academic_summary.rank || 'N/A'} of ${rc.academic_summary.total_students}</div>
            <div class="info-label" style="margin-top: 15px;">Report Date</div>
            <div class="info-value">${new Date(rc.generated_at).toLocaleDateString()}</div>
          </div>
        </div>
        
        <h3 style="color: #1E293B; border-bottom: 2px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 0;">Academic Performance</h3>
        <table>
          <tr>
            <th>Subject</th>
            <th style="text-align: center;">Code</th>
            <th style="text-align: center;">Marks Obtained</th>
            <th style="text-align: center;">Maximum Marks</th>
            <th style="text-align: center;">Percentage</th>
            <th style="text-align: center;">Grade</th>
            <th style="text-align: center;">Attendance</th>
          </tr>
          ${subjectsRows}
        </table>
        
        <div class="summary-section">
          <div class="summary-box">
            <div class="summary-label">Total Marks</div>
            <div class="summary-value" style="font-size: 24px;">${rc.academic_summary.total_obtained}/${rc.academic_summary.total_max}</div>
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
        
        <div class="attendance-box">
          <h4 style="margin: 0 0 12px; color: #1E293B;">Attendance Summary</h4>
          <p style="margin: 0; color: #64748B;">
            Total Days: <strong>${rc.attendance_summary.total_days}</strong> | 
            Present: <strong style="color: #059669;">${rc.attendance_summary.present}</strong> | 
            Absent: <strong style="color: #DC2626;">${rc.attendance_summary.absent}</strong> | 
            Late: <strong style="color: #F59E0B;">${rc.attendance_summary.late}</strong> | 
            Overall Attendance: <strong style="color: #4F46E5;">${rc.attendance_summary.percentage}%</strong>
          </p>
        </div>
        
        <div class="remarks-box">
          <div class="remarks-title">Teacher's Remarks</div>
          <p style="margin: 0; color: #78350F;">${rc.remarks}</p>
        </div>
        
        <div class="result-box">
          <span class="${rc.academic_summary.status === 'Pass' ? 'result-pass' : 'result-fail'}">
            Result: ${rc.academic_summary.status}
          </span>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">This is a computer-generated report card and does not require a signature.</p>
          <p style="margin: 5px 0 0;">Generated on ${new Date(rc.generated_at).toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-amber-100 text-amber-800';
    if (grade === 'D') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <DashboardLayout title="My Report Card">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!reportCard) {
    return (
      <DashboardLayout title="My Report Card">
        <Card className="dashboard-card">
          <CardContent className="p-12">
            <div className="text-center">
              <FileSpreadsheet className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Report Card Not Available</h3>
              <p className="text-slate-500">Your report card will be available once grades are recorded.</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Report Card">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Percentage</p>
                <p className="text-2xl font-bold text-indigo-600">{reportCard.academic_summary.percentage}%</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Grade</p>
                <p className="text-2xl font-bold text-purple-600">{reportCard.academic_summary.grade_letter}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">GPA</p>
                <p className="text-2xl font-bold text-emerald-600">{reportCard.academic_summary.gpa}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Class Rank</p>
                <p className="text-2xl font-bold text-amber-600">
                  {reportCard.academic_summary.rank || 'N/A'}/{reportCard.academic_summary.total_students}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">My Report Card</CardTitle>
            <p className="text-sm text-slate-500 mt-1">{reportCard.term?.name || 'Current Term'}</p>
          </div>
          <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </CardHeader>
        <CardContent>
          {/* Student Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-lg mb-6">
            <div>
              <p className="text-xs text-slate-500 uppercase">Student Name</p>
              <p className="font-semibold text-lg">{reportCard.student.name}</p>
              <p className="text-xs text-slate-500 uppercase mt-3">Student ID</p>
              <p className="font-semibold">{reportCard.student.student_id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Class</p>
              <p className="font-semibold text-lg">{reportCard.student.grade} - {reportCard.student.section || 'N/A'}</p>
              <p className="text-xs text-slate-500 uppercase mt-3">Email</p>
              <p className="font-semibold text-sm">{reportCard.student.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Result</p>
              <p className={`font-bold text-2xl ${reportCard.academic_summary.status === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                {reportCard.academic_summary.status}
              </p>
              <p className="text-xs text-slate-500 uppercase mt-3">Report Date</p>
              <p className="font-semibold">{new Date(reportCard.generated_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Subject Table */}
          <h3 className="font-semibold mb-3 border-b pb-2">Subject-wise Performance</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-indigo-50">Subject</TableHead>
                <TableHead className="bg-indigo-50 text-center">Code</TableHead>
                <TableHead className="bg-indigo-50 text-center">Marks Obtained</TableHead>
                <TableHead className="bg-indigo-50 text-center">Maximum Marks</TableHead>
                <TableHead className="bg-indigo-50 text-center">Percentage</TableHead>
                <TableHead className="bg-indigo-50 text-center">Grade</TableHead>
                <TableHead className="bg-indigo-50 text-center">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportCard.subjects.map((subj, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{subj.course_name}</TableCell>
                  <TableCell className="text-center">{subj.course_code}</TableCell>
                  <TableCell className="text-center font-semibold">{subj.marks_obtained}</TableCell>
                  <TableCell className="text-center">{subj.marks_max}</TableCell>
                  <TableCell className="text-center">{subj.percentage}%</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getGradeColor(subj.grade_letter)}>
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
            <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-lg border">
              <p className="text-xs text-slate-500 uppercase">Total Marks</p>
              <p className="text-2xl font-bold text-indigo-600">{reportCard.academic_summary.total_obtained}/{reportCard.academic_summary.total_max}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-purple-50 rounded-lg border">
              <p className="text-xs text-slate-500 uppercase">Percentage</p>
              <p className="text-2xl font-bold text-purple-600">{reportCard.academic_summary.percentage}%</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-emerald-50 rounded-lg border">
              <p className="text-xs text-slate-500 uppercase">Grade</p>
              <p className="text-2xl font-bold text-emerald-600">{reportCard.academic_summary.grade_letter}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-amber-50 rounded-lg border">
              <p className="text-xs text-slate-500 uppercase">GPA</p>
              <p className="text-2xl font-bold text-amber-600">{reportCard.academic_summary.gpa}</p>
            </div>
          </div>

          {/* Attendance */}
          <div className="p-4 bg-slate-50 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Attendance Summary</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Total Days: <strong>{reportCard.attendance_summary.total_days}</strong></span>
              <span>Present: <strong className="text-emerald-600">{reportCard.attendance_summary.present}</strong></span>
              <span>Absent: <strong className="text-red-600">{reportCard.attendance_summary.absent}</strong></span>
              <span>Late: <strong className="text-amber-600">{reportCard.attendance_summary.late}</strong></span>
              <span>Overall: <strong className="text-indigo-600">{reportCard.attendance_summary.percentage}%</strong></span>
            </div>
          </div>

          {/* Remarks */}
          <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
            <h4 className="font-semibold mb-1 text-amber-900">Teacher's Remarks</h4>
            <p className="text-sm text-amber-800">{reportCard.remarks}</p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentReportCard;
