import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext();

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    queryClient.clear();
    navigate('/login');
    toast.success('Sesión cerrada');
  }, [queryClient, navigate]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, user not authenticated');
          setLoading(false);
          return;
        }

        console.log('Token found, checking authentication...');
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/api/v1/auth/me');
        const userData = response.data;

        console.log('Authentication successful:', userData);

        // Normalizar los campos del usuario para compatibilidad
        const normalizedUser = {
          ...userData,
          role: userData.role || userData.rol,
          full_name: userData.full_name || userData.nombre,
          username: userData.username || userData.nombre,
          email: userData.email || userData.correo,
          created_at: userData.created_at || userData.fecha_creacion,
          id: userData.id || userData.id_usuario
        };
        
        setUser(normalizedUser);
      } catch (error) {
        console.error('Auth check failed:', error);
        console.log('Error details:', error.response?.data || error.message);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        console.log('Auth check completed, loading finished');
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/login-form', credentials);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Get user info
      const userResponse = await api.get('/api/v1/auth/me');
      const userData = userResponse.data;
      
      // Normalizar los campos del usuario para compatibilidad
      const normalizedUser = {
        ...userData,
        role: userData.role || userData.rol,
        full_name: userData.full_name || userData.nombre,
        username: userData.username || userData.nombre,
        email: userData.email || userData.correo,
        created_at: userData.created_at || userData.fecha_creacion,
        id: userData.id || userData.id_usuario
      };
      
      setUser(normalizedUser);
      
      toast.success('¡Bienvenido!');
      navigate('/');
      
      return userResponse.data;
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.detail || 'Error al iniciar sesión';
      toast.error(message);
      throw error;
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await api.put(`/api/v1/users/${user.id}`, userData);
      setUser(response.data);
      toast.success('Perfil actualizado');
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.detail || 'Error al actualizar perfil';
      toast.error(message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    isClient: user?.role === 'client',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
