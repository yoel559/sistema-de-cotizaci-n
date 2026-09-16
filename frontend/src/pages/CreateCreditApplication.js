import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCreditCard } from 'react-icons/fi';
import { creditAPI, quotationsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateCreditApplication = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    id_cotizacion: '',
    monto_solicitado: '',
    plazo_meses: '',
    ingresos_mensuales: '',
    estado: 'pendiente'
  });

  // Fetch quotations for dropdown
  const { data: quotationsData, isLoading: quotationsLoading } = useQuery(
    'quotations-for-credit',
    () => quotationsAPI.getAll({ limit: 1000 }),
    {
      enabled: true,
    }
  );

  const quotations = Array.isArray(quotationsData?.data) ? quotationsData.data : [];

  // Create credit application mutation
  const createCreditMutation = useMutation(
    (creditData) => creditAPI.createApplication(creditData),
    {
      onSuccess: () => {
        toast.success('Aplicación de crédito creada exitosamente');
        queryClient.invalidateQueries('credit-applications');
        navigate('/credit');
      },
      onError: (error) => {
        toast.error('Error al crear aplicación: ' + (error.response?.data?.detail || error.message));
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createCreditMutation.mutate(formData);
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
          onClick={() => navigate('/credit')}
          className="btn btn-ghost btn-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Aplicación de Crédito</h1>
          <p className="text-base-content/60">Crear una nueva aplicación de crédito</p>
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

            {/* Monto solicitado */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Monto Solicitado</span>
              </label>
              <input
                type="number"
                name="monto_solicitado"
                value={formData.monto_solicitado}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="25000"
                required
              />
            </div>

            {/* Plazo en meses */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Plazo (meses)</span>
              </label>
              <input
                type="number"
                name="plazo_meses"
                value={formData.plazo_meses}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="36"
                required
              />
            </div>

            {/* Ingresos mensuales */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Ingresos Mensuales</span>
              </label>
              <input
                type="number"
                name="ingresos_mensuales"
                value={formData.ingresos_mensuales}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="5000"
                required
              />
            </div>

            {/* Estado */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Estado</span>
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="select select-bordered"
              >
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="en_revision">En Revisión</option>
              </select>
            </div>

            {/* Submit */}
            <div className="form-control pt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createCreditMutation.isLoading}
              >
                {createCreditMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiCreditCard className="w-4 h-4 mr-2" />
                    Crear Aplicación
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

export default CreateCreditApplication;
