import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FiUser,
  FiMail,
  FiShield,
  FiCalendar,
  FiEdit3,
  FiSave,
  FiX
} from 'react-icons/fi';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    username: user?.username || '',
    role: user?.role || '',
    phone: user?.phone || '',
    department: user?.department || '',
    position: user?.position || '',
    hire_date: user?.hire_date || '',
    bio: user?.bio || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Aquí se implementaría la lógica para guardar los cambios
    console.log('Guardando cambios:', formData);
    setIsEditing(false);
    // TODO: Implementar actualización del perfil
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      username: user?.username || '',
      role: user?.role || '',
      phone: user?.phone || '',
      department: user?.department || '',
      position: user?.position || '',
      hire_date: user?.hire_date || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'manager': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'sales': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'support': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return '👑';
      case 'manager': return '👨‍💼';
      case 'sales': return '💼';
      case 'support': return '🛠️';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient animate-fade-in-left">
            Perfil de Usuario
          </h1>
          <p className="text-slate-400 mt-2 animate-fade-in-left" style={{ animationDelay: '0.1s' }}>
            Gestiona tu información personal y configuración
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-modern text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-right"
            >
              <FiEdit3 className="w-4 h-4 mr-2" />
              Editar Perfil
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="btn bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FiSave className="w-4 h-4 mr-2" />
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="btn bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FiX className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar y Info Básica */}
        <div className="lg:col-span-1">
          <div className="glass-effect rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-center">
              <div className="w-32 h-32 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-float">
                <span className="text-4xl font-bold text-white">
                  {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {user?.full_name || user?.username || 'Usuario'}
              </h2>
              <div className={`badge px-4 py-2 text-sm font-medium border ${getRoleColor(user?.role)}`}>
                {getRoleIcon(user?.role)} {user?.role || 'Usuario'}
              </div>
              <p className="text-slate-400 mt-4 text-sm">
                Miembro desde {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Estadísticas Rápidas */}
          <div className="glass-effect rounded-xl p-6 mt-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-lg font-bold text-white mb-4">Estadísticas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Cotizaciones</span>
                <span className="text-white font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Clientes</span>
                <span className="text-white font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Alertas</span>
                <span className="text-white font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Última Actividad</span>
                <span className="text-white font-semibold">Hoy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Información Detallada */}
        <div className="lg:col-span-2">
          <div className="glass-effect rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-xl font-bold text-white mb-6">Información Personal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre Completo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center">
                  <FiUser className="w-4 h-4 mr-2" />
                  Nombre Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    placeholder="Ingresa tu nombre completo"
                  />
                ) : (
                  <p className="text-white text-lg">{user?.full_name || 'No especificado'}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center">
                  <FiMail className="w-4 h-4 mr-2" />
                  Correo Electrónico
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    placeholder="tu@email.com"
                  />
                ) : (
                  <p className="text-white text-lg">{user?.email || 'No especificado'}</p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center">
                  <FiUser className="w-4 h-4 mr-2" />
                  Nombre de Usuario
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    placeholder="nombre_usuario"
                  />
                ) : (
                  <p className="text-white text-lg">{user?.username || 'No especificado'}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center">
                  <FiMail className="w-4 h-4 mr-2" />
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <p className="text-white text-lg">{user?.phone || 'No especificado'}</p>
                )}
              </div>

              {/* Departamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center">
                  <FiShield className="w-4 h-4 mr-2" />
                  Departamento
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    placeholder="Ventas, Marketing, etc."
                  />
                ) : (
                  <p className="text-white text-lg">{user?.department || 'No especificado'}</p>
                )}
              </div>

              {/* Posición */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center">
                  <FiCalendar className="w-4 h-4 mr-2" />
                  Posición
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    placeholder="Gerente, Vendedor, etc."
                  />
                ) : (
                  <p className="text-white text-lg">{user?.position || 'No especificado'}</p>
                )}
              </div>
            </div>

            {/* Biografía */}
            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center">
                <FiEdit3 className="w-4 h-4 mr-2" />
                Biografía
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="Cuéntanos algo sobre ti..."
                />
              ) : (
                <p className="text-white text-lg leading-relaxed">
                  {user?.bio || 'No hay biografía disponible'}
                </p>
              )}
            </div>
          </div>

          {/* Configuración de Seguridad */}
          <div className="glass-effect rounded-xl p-6 mt-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-xl font-bold text-white mb-6">Configuración de Seguridad</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Cambiar Contraseña</h4>
                  <p className="text-slate-400 text-sm">Actualiza tu contraseña para mayor seguridad</p>
                </div>
                <button className="btn btn-outline border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                  Cambiar
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Autenticación de Dos Factores</h4>
                  <p className="text-slate-400 text-sm">Agrega una capa extra de seguridad</p>
                </div>
                <button className="btn btn-outline border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                  Configurar
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Sesiones Activas</h4>
                  <p className="text-slate-400 text-sm">Gestiona tus sesiones activas</p>
                </div>
                <button className="btn btn-outline border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                  Ver Sesiones
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
