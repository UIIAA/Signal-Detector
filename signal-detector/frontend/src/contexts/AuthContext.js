import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
    } else {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, [session, status]);

  const login = async (email, name) => {
    try {
      // Use NextAuth's signIn
      const result = await signIn('credentials', {
        email,
        name: name || email.split('@')[0],
        redirect: false, // Don't redirect automatically
      });
      
      if (result?.ok) {
        // The session should update automatically via the useSession hook
        return session?.user;
      } else {
        throw new Error(result?.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email, name) => {
    // In our implementation, login and registration use the same endpoint
    return login(email, name);
  };

  const logout = async () => {
    await signOut({ redirect: false }); // Don't redirect after logout
  };

  const fetchWithAuth = async (url, options = {}) => {
    // Get the session token for authenticated requests
    const sessionResponse = await signIn('credentials', { redirect: false });
    
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    };

    // Add authorization header if we have a session
    if (session) {
      // NextAuth automatically handles tokens, but we can still manually add headers if needed
      // The session token should automatically be included via NextAuth cookies
    }

    const response = await fetch(url, { 
      ...options, 
      headers,
    });

    if (response.status === 401) {
      // If unauthorized, try to refresh session or redirect
      await signOut({ redirect: true, callbackUrl: '/login' });
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  };

  const value = {
    user,
    loading: status === 'loading' || loading,
    login,
    register,
    logout,
    fetchWithAuth,
    isAuthenticated: !!user && status === 'authenticated',
    sessionStatus: status,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;