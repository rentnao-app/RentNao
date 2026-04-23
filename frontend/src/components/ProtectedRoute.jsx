import { createElement, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch, getCurrentUser, clearAuthSession } from '../lib/api';

export default function ProtectedRoute({ component, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const localUser = getCurrentUser();
        const localUserId = localUser?.userId || localUser?.user_id || localUser?.id;
        if (!localUserId) {
          setLoading(false);
          return;
        }

        const res = await apiFetch(`/users/${localUserId}/profile-status`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) clearAuthSession();
          setLoading(false);
          return;
        }
        const userData = {
          role: body?.data?.role || localUser?.role || localUser?.userRole || null,
        };
        // Any authenticated user (e.g. for /account) or role must match
        if (requiredRole == null || requiredRole === '') {
          setAuthorized(true);
        } else if (userData.role === requiredRole) {
          setAuthorized(true);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return createElement(component);
}
