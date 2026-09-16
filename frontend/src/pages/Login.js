import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(credentials);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-10 flex flex-col items-center">
          <img
            src="/trebol-logo.png"
            alt="Trebol Servicios Empresariales"
            className="h-28 mb-4 drop-shadow-lg animate-float"
          />
          <p className="text-slate-300">Inicia sesión para continuar</p>
        </div>

        {/* Formulario */}
        <div className="glass-effect rounded-2xl shadow-2xl p-8 border-gradient animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Usuario */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-slate-200">Usuario</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  placeholder="Ingresa tu usuario"
                  required
                />
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>

            {/* Contraseña */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-slate-200">Contraseña</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10 pr-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-modern"
            >
              {loading ? (
                <LoadingSpinner />
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              ¿Problemas para acceder? Contacta al administrador
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm">
            © 2024 Trebol Servicios Empresariales. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
