import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { FiArrowLeft, FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import { quotationsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EditQuotation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const quotationId = id ? parseInt(id) : null;

  const [estado, setEstado] = useState('frio');

  // Fetch quotation details
  const { data: quotation, isLoading: loadingQuotation } = useQuery(
    ['quotation', quotationId],
    () => quotationsAPI.getById(quotationId),
    {
      enabled: !!quotationId,
      select: (response) => response?.data || response,
      onError: (err) => {
        console.error('Error cargando cotización:', err);
        toast.error('Error al cargar la cotización');
      }
    }
  );

  // Cargar estado actual cuando se obtiene la cotización
  useEffect(() => {
    if (quotation) {
      setEstado(quotation.estado || 'frio');
    }
  }, [quotation]);

  // Update quotation mutation - solo actualiza el estado
  const updateQuotationMutation = useMutation(
    (data) => quotationsAPI.update(quotationId, data),
    {
      onSuccess: () => {
        toast.success('Estado de cotización actualizado exitosamente');
        queryClient.invalidateQueries('quotationsData');
        queryClient.invalidateQueries(['quotation', quotationId]);
        navigate(`/quotations/${quotationId}`);
      },
      onError: (error) => {
        let errorMessage = 'Error al actualizar la cotización';
        
        if (error.response?.data) {
          const errorData = error.response.data;
          
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail
              .map(err => {
                if (typeof err === 'string') return err;
                if (err.msg) return err.msg;
                return JSON.stringify(err);
              })
              .join(', ');
          } else if (typeof errorData.detail === 'object') {
            errorMessage = errorData.detail.message || errorData.detail.msg || JSON.stringify(errorData.detail);
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.error('Error al actualizar cotización:', error);
        toast.error(errorMessage);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Solo enviar el campo estado
    const updateData = {
      estado: estado
    };
    
    updateQuotationMutation.mutate(updateData);
  };

  if (loadingQuotation) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
        </div>
        <div className="alert alert-error">
          <FiAlertCircle className="w-5 h-5" />
          <span>Cotización no encontrada</span>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-base-content">Editar Cotización</h1>
            <p className="text-base-content/60 mt-1">
              {quotation.numero_cotizacion}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información de solo lectura */}
            <div className="alert alert-info">
              <FiAlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-bold">Información</h3>
                <div className="text-sm mt-1">
                  Solo puedes cambiar el estado de la cotización. Los demás campos no son editables.
                </div>
              </div>
            </div>

            {/* Información de la cotización (solo lectura) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Número de Cotización</span>
                </label>
                <input
                  type="text"
                  value={quotation.numero_cotizacion || ''}
                  className="input input-bordered w-full bg-base-200"
                  disabled
                  readOnly
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Vehículo</span>
                </label>
                <input
                  type="text"
                  value={quotation.vehiculo || ''}
                  className="input input-bordered w-full bg-base-200"
                  disabled
                  readOnly
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Cliente</span>
                </label>
                <input
                  type="text"
                  value={quotation.cliente ? `${quotation.cliente.nombre} ${quotation.cliente.apellidos || ''}`.trim() : 'N/A'}
                  className="input input-bordered w-full bg-base-200"
                  disabled
                  readOnly
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Fecha de Registro</span>
                </label>
                <input
                  type="text"
                  value={quotation.fecha_registro ? new Date(quotation.fecha_registro).toLocaleDateString('es-ES') : 'N/A'}
                  className="input input-bordered w-full bg-base-200"
                  disabled
                  readOnly
                />
              </div>
            </div>

            {/* Estado - Campo editable */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Estado *</span>
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="select select-bordered w-full"
                required
              >
                <option value="frio">Frío</option>
                <option value="tibio">Tibio</option>
                <option value="caliente">Caliente</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  El estado determina la prioridad y el tiempo de seguimiento de la cotización
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
                disabled={updateQuotationMutation.isLoading}
              >
                <FiX className="w-4 h-4 mr-2" />
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateQuotationMutation.isLoading}
              >
                {updateQuotationMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Guardar Cambios
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

export default EditQuotation;

