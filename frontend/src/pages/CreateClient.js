import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiMail,
  FiSave,
  FiX
} from 'react-icons/fi';
import { clientsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateClient = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    email: '',
    preferencias: ''
  });

  // Create client mutation
  const createClientMutation = useMutation(
    (clientData) => clientsAPI.create(clientData),
    {
      onSuccess: () => {
        toast.success('Cliente creado exitosamente');
        queryClient.invalidateQueries('clients');
        navigate('/clients');
      },
      onError: (error) => {
        toast.error('Error al crear el cliente: ' + (error.response?.data?.detail || error.message));
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.telefono) {
      toast.error('Por favor completa los campos requeridos (Nombre, Teléfono)');
      return;
    }

    createClientMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
            <h1 className="text-3xl font-bold text-base-content">Crear Nuevo Cliente</h1>
            <p className="text-base-content/60 mt-1">
              Registra un nuevo cliente en el sistema
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Nombre del cliente"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    <FiUser className="w-4 h-4 inline mr-2" />
                    Apellidos
                  </span>
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Apellidos del cliente"
                />
              </div>
            </div>

            {/* Teléfono y Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    <FiPhone className="w-4 h-4 inline mr-2" />
                    Teléfono *
                  </span>
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    <FiMail className="w-4 h-4 inline mr-2" />
                    Correo
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="cliente@ejemplo.com"
                />
              </div>
            </div>

            {/* Preferencias */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Preferencias</span>
              </label>
              <textarea
                name="preferencias"
                value={formData.preferencias}
                onChange={handleInputChange}
                className="textarea textarea-bordered w-full h-24"
                placeholder="Preferencias del cliente, tipo de vehículo, etc."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
                disabled={createClientMutation.isLoading}
              >
                <FiX className="w-4 h-4 mr-2" />
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createClientMutation.isLoading}
              >
                {createClientMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Crear Cliente
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

export default CreateClient;
