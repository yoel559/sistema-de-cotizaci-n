import React from 'react';
import { FiUser, FiKey, FiInfo } from 'react-icons/fi';

const LoginInfo = () => {
  const testUsers = [
    { username: 'admin', password: 'admin123', role: 'Administrador' },
    { username: 'gerente', password: 'gerente123', role: 'Gerente' },
    { username: 'jefe', password: 'jefe123', role: 'Jefe' },
    { username: 'empleado', password: 'empleado123', role: 'Empleado' }
  ];

  return (
    <div className="card bg-info/10 border-info/20 shadow-lg">
      <div className="card-body">
        <div className="flex items-center gap-2 mb-4">
          <FiInfo className="w-5 h-5 text-info" />
          <h3 className="card-title text-info">Usuarios de Prueba</h3>
        </div>
        
        <p className="text-sm text-base-content/70 mb-4">
          Usa cualquiera de estas credenciales para iniciar sesión:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testUsers.map((user, index) => (
            <div key={index} className="bg-base-100 rounded-lg p-3 border border-base-300">
              <div className="flex items-center gap-2 mb-2">
                <FiUser className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{user.role}</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base-content/60">Usuario:</span>
                  <code className="bg-base-200 px-2 py-1 rounded text-primary font-mono">
                    {user.username}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <FiKey className="w-3 h-3 text-base-content/60" />
                  <span className="text-base-content/60">Contraseña:</span>
                  <code className="bg-base-200 px-2 py-1 rounded text-primary font-mono">
                    {user.password}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="alert alert-warning mt-4">
          <FiInfo className="w-4 h-4" />
          <span className="text-sm">
            Si no puedes iniciar sesión, primero crea los usuarios usando el botón "Crear Usuarios" en el dashboard.
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginInfo;
