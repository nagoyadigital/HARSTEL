import { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Memverifikasi sesi...</p>
    </div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback /> }) {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Prevent caching of protected pages
    // This ensures back button doesn't show cached dashboard after logout
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      if (!isAuthenticated) {
        window.location.replace('/login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (!isAuthenticated) {
    // Use replace to prevent back-button returning to this page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
