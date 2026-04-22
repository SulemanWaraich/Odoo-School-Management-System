import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUserFromTokens } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const error = params.get('error');

      if (error) {
        toast.error(`Authentication failed: ${error}`);
        navigate('/login', { replace: true });
        return;
      }

      if (!accessToken) {
        toast.error('No token received');
        navigate('/login', { replace: true });
        return;
      }

      localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);

      try {
        // ✅ This sets the user directly in AuthContext state
        const userData = await setUserFromTokens(accessToken);

        toast.success('Login successful!');

        // ✅ Use navigate — no full reload needed since user is already in context
        const routes = { admin: '/admin', teacher: '/teacher', student: '/student' };
        navigate(routes[userData.role] || '/student', { replace: true });

      } catch (err) {
        console.error('Failed to fetch user:', err);
        toast.error('Authentication failed. Please try again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [navigate, setUserFromTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
        <p className="mt-4 text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;