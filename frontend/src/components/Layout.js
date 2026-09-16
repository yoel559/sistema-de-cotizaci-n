import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import {
  FiHome,
  FiFileText,
  FiUsers,
  FiBell,
  FiMenu,
  FiX,
  FiLogOut,
  FiUser,
  FiSettings,
  FiTruck,
  FiCreditCard,
  FiDollarSign,
  FiPackage,
  FiWifi,
  FiWifiOff
} from 'react-icons/fi';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { isConnected } = useWebSocket();
  const location = useLocation();

  // Debug: mostrar estado en consola
  console.log('🔍 Layout Debug:', {
    isAuthenticated,
    user: user ? { id: user.id, email: user.email } : null,
    isConnected
  });

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FiHome },
    { name: 'Cotizaciones', href: '/quotations', icon: FiFileText },
    { name: 'Clientes', href: '/clients', icon: FiUsers },
    { name: 'Inventario', href: '/inventory', icon: FiTruck },
    { name: 'Créditos', href: '/credit', icon: FiCreditCard },
    { name: 'Pagos', href: '/billing', icon: FiDollarSign },
    { name: 'Entregas', href: '/deliveries', icon: FiPackage },
    { name: 'Alertas', href: '/alerts', icon: FiBell },
  ];

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 glass-effect shadow-2xl animate-fade-in-left">
          <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
            <img
              src="/trebol-logo.png"
              alt="Trebol Servicios Empresariales"
              className="h-12 object-contain"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="btn btn-ghost btn-sm hover:bg-white/10"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 animate-fade-in-left ${
                  isActive(item.href)
                    ? 'gradient-primary text-white shadow-lg transform scale-105'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white hover:transform hover:scale-105'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow glass-effect shadow-2xl">
          {/* Logo */}
          <div className="flex items-center px-4 py-5 border-b border-white/10">
            <img
              src="/trebol-logo.png"
              alt="Trebol Servicios Empresariales"
              className="h-12 object-contain animate-fade-in-left"
            />
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 animate-fade-in-left ${
                  isActive(item.href)
                    ? 'gradient-primary text-white shadow-lg transform scale-105'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white hover:transform hover:scale-105'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Usuario */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="avatar placeholder">
                <div className="gradient-primary text-white rounded-full w-10 shadow-lg animate-float">
                  <span className="text-sm font-medium">
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <Link
                to="/profile"
                className="btn btn-ghost btn-sm w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 hover:transform hover:scale-105"
              >
                <FiUser className="w-4 h-4 mr-2" />
                Perfil
              </Link>
              <button className="btn btn-ghost btn-sm w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 hover:transform hover:scale-105">
                <FiSettings className="w-4 h-4 mr-2" />
                Configuración
              </button>
              <button
                onClick={logout}
                className="btn btn-ghost btn-sm w-full justify-start text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 hover:transform hover:scale-105"
              >
                <FiLogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="glass-effect border-b border-white/10 backdrop-blur-glass">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden btn btn-ghost btn-sm hover:bg-white/10"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-white ml-2 lg:ml-0 animate-fade-in-right">
                {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h2>
            </div>
            
            {/* Indicador de conexión WebSocket */}
            <div className="flex items-center space-x-2">
              <div className="tooltip" data-tip={`WebSocket: ${isConnected ? 'conectado' : 'desconectado'} - Debug: ${JSON.stringify({isConnected})}`}>
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  isConnected
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`} onClick={() => console.log('🔍 WebSocket debug:', {isConnected, user: {id: user?.id, email: user?.email}, isAuthenticated: isAuthenticated})}>
                  {isConnected ? (
                    <FiWifi className="w-4 h-4" />
                  ) : (
                    <FiWifiOff className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium">
                    {isConnected ? 'En línea' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="p-6 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
