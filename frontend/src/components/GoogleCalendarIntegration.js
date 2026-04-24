import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const GoogleCalendarIntegration = ({ onSuccess, onError }) => {
  const [isIntegrated, setIsIntegrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState(null);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/calendar/integration/status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setIsIntegrated(response.data.is_integrated);
      setIntegrationStatus(response.data);
    } catch (error) {
      console.error('Error checking calendar status:', error);
      if (error.response?.status !== 401) {
        setIsIntegrated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await axios.get(`${API_URL}/api/calendar/integration/url`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      // Redirect to Google OAuth
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error getting calendar auth URL:', error);
      toast.error('Failed to connect Google Calendar');
      setIsConnecting(false);
      if (onError) onError(error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await axios.post(`${API_URL}/api/calendar/integration/disconnect`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setIsIntegrated(false);
      setIntegrationStatus(null);
      toast.success('Google Calendar disconnected');
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-24">
            <Loader className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={isIntegrated ? 'border-green-200 bg-green-50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className={`w-5 h-5 ${isIntegrated ? 'text-green-600' : 'text-slate-400'}`} />
              <CardTitle className="text-lg">Google Calendar Integration</CardTitle>
            </div>
            {isIntegrated && <Badge className="bg-green-600">Connected</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {isIntegrated ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Google Calendar Connected</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Calendar ID: {integrationStatus?.calendar_id || 'primary'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Connected since {new Date(integrationStatus?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Your timetable entries can now be synced to your Google Calendar. 
                Use the sync button on individual timetable entries to add them to your calendar.
              </p>
              <Button
                onClick={() => setShowDialog(true)}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Disconnect Google Calendar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Not Connected</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Connect your Google Calendar to sync timetable entries automatically.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isConnecting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Connect Google Calendar
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Google Calendar?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to disconnect your Google Calendar? 
              You can reconnect at any time.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDialog(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleDisconnect();
                  setShowDialog(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoogleCalendarIntegration;
