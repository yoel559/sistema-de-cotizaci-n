import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { 
  FiArrowLeft,
  FiUser,
  FiMail,
  FiLock,
  FiUsers,
  FiSave,
  FiX,
  FiPhone
} from 'react-icons/fi';
import { usersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contraseña: '',
    rol: 'empleado',
    telefono: ''
  });

  // Create user mutation
  const createUserMutation = useMutation(
    (userData) => usersAPI.create(userData),
    {
      onSuccess: () => {
        toast.success('Usuario creado exitosamente');
        queryClient.invalidateQueries('users');
        navigate('/dashboard');
      },
      onError: (error) => {
        toast.error('Error al crear el usuario: ' + (error.response?.data?.detail || error.message));
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.correo || !formData.contraseña) {
      toast.error('Por favor completa los campos requeridos (Nombre, Correo, Contraseña)');
      return;
    }

    createUserMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-base-content">Crear Nuevo Usuario</h1>
            <p className="text-base-content/60 mt-1">
              Registra un nuevo usuario en el sistema
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  <FiUser className="w-4 h-4 inline mr-2" />
                  Nombre *
                </span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Nombre del usuario"
                required
              />
            </div>

            {/* Correo */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  <FiMail className="w-4 h-4 inline mr-2" />
                  Correo *
                </span>
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="usuario@email.com"
                required
              />
            </div>

            {/* Teléfono */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  <FiPhone className="w-4 h-4 inline mr-2" />
                  Teléfono
                </span>
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="1234567890"
                maxLength="20"
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Número de teléfono del usuario (opcional)
                </span>
              </label>
            </div>

            {/* Contraseña */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  <FiLock className="w-4 h-4 inline mr-2" />
                  Contraseña *
                </span>
              </label>
              <input
                type="password"
                name="contraseña"
                value={formData.contraseña}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Contraseña segura"
                required
                minLength="6"
              />
            </div>

            {/* Rol */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  <FiUsers className="w-4 h-4 inline mr-2" />
                  Rol
                </span>
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleInputChange}
                className="select select-bordered w-full"
              >
                <option value="empleado">Empleado</option>
                <option value="jefe">Jefe Comercial</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
              <label className="label">
                <span className="label-text-alt">
                  Los roles determinan los permisos de acceso en el sistema
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
                disabled={createUserMutation.isLoading}
              >
                <FiX className="w-4 h-4 mr-2" />
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createUserMutation.isLoading}
              >
                {createUserMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Crear Usuario
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;
