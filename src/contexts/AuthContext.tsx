import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('user');
const token = localStorage.getItem('token');

if (savedUser && savedUser !== 'undefined' && token) {
  try {
    setUser(JSON.parse(savedUser));
  } catch (error) {
    console.error('Error parsing saved user from localStorage:', error);
    localStorage.removeItem('user'); // Optional: clean up if it's corrupted
  }
}
    setIsLoading(false);
    
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await authAPI.login(email, password);
      
      if (response.data.success) {
        const { user: userData, token } = response.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        console.log('Login successful:', userData);
        return { success: true };
      } else {
        console.log('Login failed:', response.data.error);
        return { success: false, error: response.data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle network errors or server not running
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        return { 
          success: false, 
          error: 'Cannot connect to server. Make sure the backend is running on http://localhost:3001' 
        };
      }
      
      // Handle HTTP errors
      if (error.response?.data?.error) {
        return { success: false, error: error.response.data.error };
      }
      
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      console.log('Attempting signup for:', email);
      const response = await authAPI.register(name, email, password);
      
      if (response.data.success) {
        const { user: userData, token } = response.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        console.log('Signup successful:', userData);
        return { success: true };
      } else {
        console.log('Signup failed:', response.data.error);
        return { success: false, error: response.data.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle network errors or server not running
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        return { 
          success: false, 
          error: 'Cannot connect to server. Make sure the backend is running on http://localhost:3001' 
        };
      }
      
      // Handle HTTP errors
      if (error.response?.data?.error) {
        return { success: false, error: error.response.data.error };
      }
      
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    setUser,
    login,
    signup,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

