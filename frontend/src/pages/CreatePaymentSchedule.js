import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDollarSign, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import { paymentsAPI, quotationsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CreatePaymentSchedule = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    id_cotizacion: '',
    monto_total: '',
    tipo_pago: 'contado', // 'contado' o 'financiado'
    fecha_inicio: '',
    dias_vencimiento_financiado: '30'
  });
  const [useNewMethod, setUseNewMethod] = useState(true); // Usar nuevo método por defecto

  // Fetch quotations for dropdown
  const { data: quotationsData, isLoading: quotationsLoading } = useQuery(
    'quotations-for-payment',
    () => quotationsAPI.getAll({ limit: 1000 }),
    {
      enabled: true,
    }
  );

  const quotations = Array.isArray(quotationsData?.data) ? quotationsData.data : [];

  // Create payment schedule mutation
  const createPaymentMutation = useMutation(
    (paymentData) => {
      if (useNewMethod) {
        // Usar nuevo método con tipo de pago
        return paymentsAPI.createScheduleWithType(paymentData);
      } else {
        // Usar método antiguo (manual)
        return paymentsAPI.createSchedule(paymentData);
      }
    },
    {
      onSuccess: (data) => {
        const numCuotas = Array.isArray(data?.data) ? data.data.length : 1;
        toast.success(`Cronograma de pago creado exitosamente (${numCuotas} ${numCuotas === 1 ? 'cuota' : 'cuotas'})`);
        queryClient.invalidateQueries('payment-schedules');
        navigate('/billing');
      },
      onError: (error) => {
        toast.error('Error al crear cronograma: ' + (error.response?.data?.detail || error.message));
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (useNewMethod) {
      // Preparar datos para el nuevo método
      const paymentData = {
        id_cotizacion: parseInt(formData.id_cotizacion),
        monto_total: parseFloat(formData.monto_total),
        tipo_pago: formData.tipo_pago,
        fecha_inicio: formData.fecha_inicio || new Date().toISOString().split('T')[0],
        dias_vencimiento_financiado: formData.tipo_pago === 'financiado' ? parseInt(formData.dias_vencimiento_financiado) : undefined
      };
      createPaymentMutation.mutate(paymentData);
    } else {
      // Mantener método antiguo para compatibilidad
      createPaymentMutation.mutate(formData);
    }
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
          onClick={() => navigate('/billing')}
          className="btn btn-ghost btn-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Cronograma de Pago</h1>
          <p className="text-base-content/60">Crear un nuevo cronograma de pago</p>
        </div>
      </div>

      {/* Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Selector de método */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold">Método de Creación</span>
            </label>
            <div className="flex gap-4">
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  checked={useNewMethod}
                  onChange={() => setUseNewMethod(true)}
                  className="radio radio-primary"
                />
                <span className="label-text ml-2">Automático (Contado/Financiado)</span>
              </label>
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  checked={!useNewMethod}
                  onChange={() => setUseNewMethod(false)}
                  className="radio radio-primary"
                />
                <span className="label-text ml-2">Manual (Cuotas personalizadas)</span>
              </label>
            </div>
          </div>

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

            {/* Monto total */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Monto Total</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="monto_total"
                value={formData.monto_total}
                onChange={handleChange}
                className="input input-bordered"
                placeholder="25000.00"
                required
              />
            </div>

            {useNewMethod ? (
              <>
                {/* Tipo de pago */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Tipo de Pago</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`card cursor-pointer border-2 ${formData.tipo_pago === 'contado' ? 'border-primary bg-primary/10' : 'border-base-300'}`}>
                      <div className="card-body items-center">
                        <input
                          type="radio"
                          name="tipo_pago"
                          value="contado"
                          checked={formData.tipo_pago === 'contado'}
                          onChange={handleChange}
                          className="radio radio-primary mb-2"
                        />
                        <FiCheckCircle className="w-8 h-8 text-primary mb-2" />
                        <span className="font-semibold">Al Contado</span>
                        <span className="text-sm text-base-content/60">100% completo</span>
                      </div>
                    </label>
                    <label className={`card cursor-pointer border-2 ${formData.tipo_pago === 'financiado' ? 'border-primary bg-primary/10' : 'border-base-300'}`}>
                      <div className="card-body items-center">
                        <input
                          type="radio"
                          name="tipo_pago"
                          value="financiado"
                          checked={formData.tipo_pago === 'financiado'}
                          onChange={handleChange}
                          className="radio radio-primary mb-2"
                        />
                        <FiCreditCard className="w-8 h-8 text-primary mb-2" />
                        <span className="font-semibold">Financiado</span>
                        <span className="text-sm text-base-content/60">50% inicial, 50% deuda</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Fecha de inicio (opcional) */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Fecha de Inicio (opcional)</span>
                  </label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    className="input input-bordered"
                  />
                  <label className="label">
                    <span className="label-text-alt">Si no se especifica, se usa la fecha actual</span>
                  </label>
                </div>

                {/* Días de vencimiento para financiado */}
                {formData.tipo_pago === 'financiado' && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Días para el Segundo Pago</span>
                    </label>
                    <input
                      type="number"
                      name="dias_vencimiento_financiado"
                      value={formData.dias_vencimiento_financiado}
                      onChange={handleChange}
                      className="input input-bordered"
                      placeholder="30"
                      min="1"
                    />
                    <label className="label">
                      <span className="label-text-alt">Días desde el primer pago hasta el segundo pago (50% restante)</span>
                    </label>
                  </div>
                )}

                {/* Resumen */}
                {formData.monto_total && (
                  <div className="alert alert-info">
                    <div>
                      <h3 className="font-bold">Resumen del Cronograma</h3>
                      <div className="text-sm mt-2">
                        {formData.tipo_pago === 'contado' ? (
                          <>
                            <p><strong>Cuota 1:</strong> ${parseFloat(formData.monto_total || 0).toFixed(2)} (100%)</p>
                            <p className="text-xs mt-1">Total: 1 cuota</p>
                          </>
                        ) : (
                          <>
                            <p><strong>Cuota 1:</strong> ${(parseFloat(formData.monto_total || 0) * 0.5).toFixed(2)} (50%) - Fecha: {formData.fecha_inicio || 'Hoy'}</p>
                            <p><strong>Cuota 2:</strong> ${(parseFloat(formData.monto_total || 0) * 0.5).toFixed(2)} (50%) - Vence en {formData.dias_vencimiento_financiado} días</p>
                            <p className="text-xs mt-1">Total: 2 cuotas</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Método manual (mantener campos antiguos) */}
                <div className="alert alert-warning">
                  <span>Método manual: Debes crear cada cuota individualmente</span>
                </div>
                {/* Aquí irían los campos del método manual antiguo si se necesitan */}
              </>
            )}

            {/* Submit */}
            <div className="form-control pt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createPaymentMutation.isLoading}
              >
                {createPaymentMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiDollarSign className="w-4 h-4 mr-2" />
                    Crear Cronograma
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

export default CreatePaymentSchedule;
