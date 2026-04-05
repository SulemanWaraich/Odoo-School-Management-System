import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Upload, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAssignments();
    fetchSubmissions();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assignments`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/submissions`);
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const getSubmission = (assignmentId) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const openSubmitDialog = (assignment) => {
    const existing = getSubmission(assignment.id);
    setSelectedAssignment(assignment);
    setFile(null);
    setNotes(existing?.notes || '');
    setDialogOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      let filePath = null;
      let fileName = null;

      // Upload file if selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await axios.post(`${API_URL}/api/submissions/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        filePath = uploadResponse.data.path;
        fileName = uploadResponse.data.filename;
      }

      // Create/update submission
      await axios.post(`${API_URL}/api/submissions`, {
        assignment_id: selectedAssignment.id,
        file_path: filePath,
        file_name: fileName,
        notes: notes
      });

      toast.success('Assignment submitted successfully');
      setDialogOpen(false);
      fetchSubmissions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit assignment');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (assignment) => {
    const submission = getSubmission(assignment.id);
    if (submission) {
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Submitted</Badge>;
    }
    if (isOverdue(assignment.due_date)) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
  };

  // Stats
  const stats = {
    total: assignments.length,
    submitted: submissions.length,
    pending: assignments.filter(a => !getSubmission(a.id) && !isOverdue(a.due_date)).length,
    overdue: assignments.filter(a => !getSubmission(a.id) && isOverdue(a.due_date)).length,
  };

  return (
    <DashboardLayout title="My Assignments">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Submitted</p>
                <p className="text-2xl font-semibold text-emerald-600">{stats.submitted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Pending</p>
                <p className="text-2xl font-semibold text-amber-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Overdue</p>
                <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Work Sans' }}>
            Assignment List
          </CardTitle>
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
                    <TableHead className="bg-slate-50">Title</TableHead>
                    <TableHead className="bg-slate-50">Course</TableHead>
                    <TableHead className="bg-slate-50">Due Date</TableHead>
                    <TableHead className="bg-slate-50">Max Score</TableHead>
                    <TableHead className="bg-slate-50">Status</TableHead>
                    <TableHead className="bg-slate-50 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id} data-testid={`assignment-row-${assignment.id}`}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell>{assignment.course?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {format(new Date(assignment.due_date), 'PPP')}
                        </div>
                      </TableCell>
                      <TableCell>{assignment.max_score}</TableCell>
                      <TableCell>{getStatusBadge(assignment)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSubmitDialog(assignment)}
                          data-testid={`submit-btn-${assignment.id}`}
                        >
                          {getSubmission(assignment.id) ? 'Update' : 'Submit'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {assignments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No assignments yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-900">{selectedAssignment?.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                Due: {selectedAssignment && format(new Date(selectedAssignment.due_date), 'PPP')}
              </p>
              {selectedAssignment?.description && (
                <p className="text-sm text-slate-600 mt-2">{selectedAssignment.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Upload File (Optional)</Label>
              <div 
                className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                {file ? (
                  <p className="text-sm text-indigo-600 font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                data-testid="file-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about your submission..."
                rows={3}
                data-testid="submission-notes-input"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={uploading}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="confirm-submit-btn"
              >
                {uploading ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentAssignments;
