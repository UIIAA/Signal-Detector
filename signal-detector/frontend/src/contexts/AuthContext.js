import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const registerUserInDatabase = async (userData) => {
  try {
    await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userData.id,
        name: userData.name,
        email: userData.email
      }),
    });
  } catch (error) {
    console.error('Error registering user in database:', error);
    // Don't throw error - allow user to continue even if DB registration fails
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('signalRuidoUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        localStorage.removeItem('signalRuidoUser');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, name = null) => {
    try {
      let userData;

      const storedUser = localStorage.getItem('signalRuidoUser');
      if (storedUser) {
        userData = JSON.parse(storedUser);
        if (userData.email === email) {
          // Register user in database if not exists
          await registerUserInDatabase(userData);
          setUser(userData);
          return userData;
        }
      }

      userData = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        email,
        name: name || email.split('@')[0],
        createdAt: new Date().toISOString()
      };

      // Register user in database
      await registerUserInDatabase(userData);

      localStorage.setItem('signalRuidoUser', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Erro ao fazer login');
    }
  };

  const register = async (email, name) => {
    try {
      const existingUser = localStorage.getItem('signalRuidoUser');
      if (existingUser) {
        const parsed = JSON.parse(existingUser);
        if (parsed.email === email) {
          throw new Error('Este email já está registrado');
        }
      }

      const userData = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        email,
        name,
        createdAt: new Date().toISOString()
      };

      // Register user in database
      await registerUserInDatabase(userData);

      localStorage.setItem('signalRuidoUser', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('signalRuidoUser');
    setUser(null);
  };

  const updateUser = (updates) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    localStorage.setItem('signalRuidoUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;