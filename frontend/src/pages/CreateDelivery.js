import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPackage } from 'react-icons/fi';
import { inventoryAPI, quotationsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateDelivery = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    id_cotizacion: '',
    vehicle_id: '',
    delivered_at: '',
    notes: ''
  });

  // Fetch quotations for dropdown
  const { data: quotationsData, isLoading: quotationsLoading } = useQuery(
    'quotations-for-delivery',
    () => quotationsAPI.getAll({ limit: 1000 }),
    {
      enabled: true,
    }
  );

  const quotations = Array.isArray(quotationsData?.data) ? quotationsData.data : [];

  // Create delivery mutation
  const createDeliveryMutation = useMutation(
    (deliveryData) => inventoryAPI.createDelivery(deliveryData),
    {
      onSuccess: () => {
        toast.success('Entrega creada exitosamente');
        queryClient.invalidateQueries('deliveries');
        navigate('/deliveries');
      },
      onError: (error) => {
        toast.error('Error al crear entrega: ' + (error.response?.data?.detail || error.message));
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createDeliveryMutation.mutate(formData);
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
          onClick={() => navigate('/deliveries')}
          className="btn btn-ghost btn-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Entrega</h1>
          <p className="text-base-content/60">Crear una nueva entrega</p>
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

            {/* Vehicle ID */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">ID del Vehículo</span>
              </label>
              <input
                type="number"
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="1"
                required
              />
            </div>

            {/* Fecha de entrega */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Fecha de Entrega</span>
              </label>
              <input
                type="datetime-local"
                name="delivered_at"
                value={formData.delivered_at}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            {/* Notas */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Notas</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="textarea textarea-bordered"
                placeholder="Notas adicionales sobre la entrega..."
                rows={4}
              />
            </div>

            {/* Submit */}
            <div className="form-control pt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createDeliveryMutation.isLoading}
              >
                {createDeliveryMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiPackage className="w-4 h-4 mr-2" />
                    Crear Entrega
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

export default CreateDelivery;
