import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Calendar, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const CalendarSyncButton = ({ timetableId, isSynced = false, onSync = null, onError = null }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [synced, setSynced] = useState(isSynced);

  const handleSync = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API_URL}/api/calendar/sync/timetable/${timetableId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      setSynced(true);
      toast.success('Timetable entry synced to Google Calendar');
      if (onSync) onSync(response.data);
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to sync to Google Calendar';
      
      if (errorMessage.includes('not integrated')) {
        toast.error('Please connect your Google Calendar first');
      } else {
        toast.error(errorMessage);
      }
      
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (synced) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-green-600 hover:bg-green-50"
              disabled
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Synced to Google Calendar</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleSync}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:bg-slate-100"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sync to Google Calendar</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CalendarSyncButton;
