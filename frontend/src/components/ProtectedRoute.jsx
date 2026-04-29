import { createElement, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  clearAuthSession,
  fetchProfileStatus,
  getCurrentUser,
  getUserId,
  getUserRole,
  resolveOnboardingRoute,
} from '../lib/api';

export default function ProtectedRoute({ component, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const localUser = getCurrentUser();
        const localUserId = getUserId(localUser);
        const localRole = getUserRole(localUser);
        if (!localUserId) {
          setRedirectTo('/login');
          return;
        }

        const { res, profileStatus, role, body } = await fetchProfileStatus(localUserId);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            clearAuthSession();
          }
          setRedirectTo('/login');
          return;
        }

        const effectiveRole = role || localRole;
        const kycStatus = body?.data?.kycVerificationStatus || null;

        if (profileStatus !== 'COMPLETED') {
          setRedirectTo(resolveOnboardingRoute(profileStatus, effectiveRole, kycStatus));
          return;
        }

        if (effectiveRole !== 'ADMIN' && kycStatus !== 'APPROVED') {
          setRedirectTo(resolveOnboardingRoute(profileStatus, effectiveRole, kycStatus));
          return;
        }

        // Any authenticated completed user (e.g. /account) or role must match.
        if (requiredRole == null || requiredRole === '') {
          setAuthorized(true);
        } else if (effectiveRole === requiredRole) {
          setAuthorized(true);
        } else {
          setRedirectTo('/login');
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setRedirectTo('/login');
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

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return createElement(component);
}
