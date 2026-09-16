import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell } from 'react-icons/fi';
import { alertsAPI, quotationsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateAlert = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    id_cotizacion: '',
    fecha_alerta: '',
    estado_alerta: 'pendiente',
    message: ''
  });

  // Fetch quotations for dropdown
  const { data: quotationsData, isLoading: quotationsLoading } = useQuery(
    'quotations-for-alert',
    () => quotationsAPI.getAll({ limit: 1000 }),
    {
      enabled: true,
    }
  );

  const quotations = Array.isArray(quotationsData?.data) ? quotationsData.data : [];

  // Create alert mutation
  const createAlertMutation = useMutation(
    (alertData) => alertsAPI.create(alertData),
    {
      onSuccess: () => {
        toast.success('Alerta creada exitosamente');
        queryClient.invalidateQueries('alertsData');
        navigate('/alerts');
      },
      onError: (error) => {
        toast.error('Error al crear alerta: ' + (error.response?.data?.detail || error.message));
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createAlertMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (quotationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/alerts')}
          className="btn btn-ghost btn-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Alerta</h1>
          <p className="text-base-content/60">Crear una nueva alerta</p>
        </div>
      </div>

      {/* Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cotización */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Cotización</span>
              </label>
              <select
                name="id_cotizacion"
                value={formData.id_cotizacion}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="">Seleccionar cotización</option>
                {quotations.map(quotation => (
                  <option key={quotation.id_cotizacion} value={quotation.id_cotizacion}>
                    {quotation.numero_cotizacion} - {quotation.vehiculo}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de alerta */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Fecha de Alerta</span>
              </label>
              <input
                type="date"
                name="fecha_alerta"
                value={formData.fecha_alerta}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            {/* Estado */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Estado</span>
              </label>
              <select
                name="estado_alerta"
                value={formData.estado_alerta}
                onChange={handleChange}
                className="select select-bordered"
              >
                <option value="pendiente">Pendiente</option>
                <option value="atendida">Atendida</option>
                <option value="vencida">Vencida</option>
              </select>
            </div>

            {/* Mensaje */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Mensaje</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="textarea textarea-bordered"
                placeholder="Descripción de la alerta..."
                rows={4}
                required
              />
            </div>

            {/* Submit */}
            <div className="form-control pt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createAlertMutation.isLoading}
              >
                {createAlertMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiBell className="w-4 h-4 mr-2" />
                    Crear Alerta
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

export default CreateAlert;
