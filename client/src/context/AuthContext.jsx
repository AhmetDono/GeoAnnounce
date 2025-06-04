import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Set default authorization header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Try to decode the token locally first
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            // Set user from token payload
            setCurrentUser({
              id: payload._id || payload.id,
              email: payload.email,
              userName: payload.userName,
              role: payload.role
            });
            setIsAuthenticated(true);
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError);
            logout();
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:4000/api/user/login', { email, password });
      const { token } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Decode token
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Update state
      setCurrentUser({
        id: payload._id || payload.id,
        email: payload.email,
        userName: payload.userName,
        role: payload.role
      });
      setIsAuthenticated(true);
      
      return { success: true, user: payload };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Giriş yapılırken bir hata oluştu' 
      };
    }
  };

  // Register function
  const register = async (userName, email, password) => {
    try {
      const response = await axios.post('http://localhost:4000/api/user/register', {
        userName,
        email,
        password
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Kayıt olurken bir hata oluştu' 
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!currentUser || !currentUser.role) return false;
    
    // If role is an array, check if it includes the required role
    if (Array.isArray(currentUser.role)) {
      return currentUser.role.includes(role);
    }
    
    // If role is a string, check if it equals the required role
    return currentUser.role === role;
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;