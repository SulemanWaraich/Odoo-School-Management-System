// src/pages/AuthCallback.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      // ✅ Read query params sent by backend
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const role = params.get('role');
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

      // ✅ Store tokens in localStorage
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);

      try {
        // ✅ Fetch user data from backend using the token
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/auth/me`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const userData = response.data;

        // ✅ Store user in localStorage so AuthContext can pick it up on reload
        localStorage.setItem('user', JSON.stringify(userData));

        toast.success('Login successful!');

        // ✅ Force a full page redirect so AuthContext re-initializes with new token
        const routes = { admin: '/admin', teacher: '/teacher', student: '/student' };
        window.location.href = routes[userData.role] || '/student';

      } catch (err) {
        console.error('Failed to fetch user:', err);
        toast.error('Authentication failed. Please try again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [navigate]);

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
