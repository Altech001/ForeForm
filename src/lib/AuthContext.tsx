import React, { useState, useEffect } from 'react';
import { base44, getToken } from '@/api/foreform';
import { AuthContext } from '@/lib/auth-context';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const cachedUserRef = React.useRef<any>(base44.auth.getCachedUser?.() || null);
  const hasTokenRef = React.useRef(Boolean(getToken()));
  const [user, setUser] = useState(cachedUserRef.current);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(cachedUserRef.current));
  const [isLoadingAuth, setIsLoadingAuth] = useState(!cachedUserRef.current && hasTokenRef.current);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState<any>(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);
      const cachedUser = base44.auth.getCachedUser?.();
      if (cachedUser) {
        setUser(cachedUser);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        await checkUserAuth({ background: true, force: true });
        return;
      }

      if (!getToken()) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      await checkUserAuth();
    } catch (error) {
      console.error('Unexpected error:', error);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async (options: { background?: boolean; force?: boolean } = {}) => {
    if (!options.background) {
      setIsLoadingAuth(true);
    }

    try {
      const currentUser = await base44.auth.me({ force: options.force });
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error: any) {
      if (options.background && error?.status !== 401 && error?.status !== 403) {
        console.warn('Background auth refresh failed:', error);
        return;
      }

      console.error('User auth check failed:', error);
      base44.auth.clearUserCache?.();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? '/login' : undefined);
  };

  const navigateToLogin = () => {
    // If not authenticated, we just gracefully handle it
    base44.auth.redirectToLogin(window.location.href);
  };

  const loginUser = async (email: string, password: string) => {
    await base44.auth.login(email, password);
    await checkUserAuth({ force: true });
  };

  const googleLoginUser = async (token: string) => {
    await base44.auth.googleLogin(token);
    await checkUserAuth({ force: true });
  };

  const registerUser = async (email: string, name: string, password: string) => {
    await base44.auth.register(email, name, password);
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
      loginUser,
      googleLoginUser,
      registerUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
