// src/pages/AuthCallback.jsx
// Handles the redirect from backend after Google OAuth.
// Backend sends: /auth/callback?access_token=...&refresh_token=...&role=...&user_id=...

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUserFromTokens } = useAuth(); // ✅ We'll use this to update auth state
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      // ✅ Backend sends tokens as QUERY PARAMS (?key=value), not hash (#key=value)
      // server.py: f"{FRONTEND_URL}/auth/callback?access_token=...&refresh_token=...&role=..."
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const role = params.get('role');
      const error = params.get('error');

      // Handle error redirected from backend
      if (error) {
        toast.error(`Authentication failed: ${error}`);
        navigate('/login', { replace: true });
        return;
      }

      // Validate we got tokens
      if (!accessToken) {
        toast.error('Invalid authentication response');
        navigate('/login', { replace: true });
        return;
      }

      try {
        // ✅ Store tokens so API calls can use them
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        // ✅ Tell AuthContext about the new user by fetching /api/auth/me
        await setUserFromTokens(accessToken);

        toast.success('Login successful!');

        // ✅ Redirect based on role
        const routes = { admin: '/admin', teacher: '/teacher', student: '/student' };
        navigate(routes[role] || '/student', { replace: true });
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Authentication failed. Please try again.');
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
