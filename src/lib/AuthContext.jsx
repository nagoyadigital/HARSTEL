import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

// Session check interval (every 60 seconds)
const SESSION_CHECK_INTERVAL = 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({});
  const sessionCheckRef = useRef(null);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // Check if session is still valid
      if (!base44.auth.isSessionValid()) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const currentUser = await base44.auth.me();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  // Start periodic session validation
  useEffect(() => {
    checkUserAuth();

    // Periodic session check
    sessionCheckRef.current = setInterval(() => {
      if (!base44.auth.isSessionValid()) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'session_expired', message: 'Sesi Anda telah berakhir. Silakan login kembali.' });
      }
    }, SESSION_CHECK_INTERVAL);

    return () => {
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
    };
  }, [checkUserAuth]);

  // Listen for storage events (logout from another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'harstel_auth_session' && !e.newValue) {
        // Session was cleared (logout in another tab)
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = useCallback(async () => {
    try {
      await base44.auth.logout();
    } catch {
      // Even if logout API fails, clear local state
    }
    // Clear all auth state
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    setAuthError(null);

    // Clear interval
    if (sessionCheckRef.current) {
      clearInterval(sessionCheckRef.current);
    }

    // Navigate using replace to prevent back-button access
    // No hard reload - React Router will handle the redirect via ProtectedRoute
  }, []);

  const navigateToLogin = useCallback(() => {
    base44.auth.redirectToLogin(window.location.href);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
