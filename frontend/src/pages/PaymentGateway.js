import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCreditCard,
  FiLock,
  FiCheck,
  FiShield,
  FiDollarSign,
  FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const PaymentGateway = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Datos simulados del pago (podrían venir de props o state)
  const paymentData = location.state || {
    amount: 15000,
    quotationNumber: 'COT-2024-001',
    clientName: 'Juan Pérez',
    description: 'Pago de cotización'
  };

  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    phone: ''
  });

  const [step, setStep] = useState(1); // 1: Formulario, 2: Procesando, 3: Confirmación

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Formatear número de tarjeta
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    // Formatear fecha de expiración
    else if (name === 'expiryDate') {
      const formatted = value.replace(/\D/g, '').replace(/(.{2})/, '$1/').slice(0, 5);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    // Solo números para CVV
    else if (name === 'cvv') {
      const formatted = value.replace(/\D/g, '').slice(0, 3);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Número de tarjeta inválido');
      return false;
    }
    if (!formData.expiryDate || formData.expiryDate.length < 5) {
      toast.error('Fecha de expiración inválida');
      return false;
    }
    if (!formData.cvv || formData.cvv.length < 3) {
      toast.error('CVV inválido');
      return false;
    }
    if (!formData.cardholderName) {
      toast.error('Nombre del titular requerido');
      return false;
    }
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('Email inválido');
      return false;
    }
    return true;
  };

  const processPayment = async () => {
    setStep(2);

    try {
      // TODO: Implementar llamada real al backend para procesar el pago
      // const response = await paymentsAPI.processPayment({
      //   quotationNumber: paymentData.quotationNumber,
      //   amount: paymentData.amount,
      //   cardData: formData
      // });
      
      // Por ahora, solo mostrar mensaje
      toast.error('Funcionalidad de pago en desarrollo. Contacta al administrador.');
      setStep(1);
    } catch (error) {
      toast.error('Error al procesar el pago. Intenta nuevamente.');
      setStep(1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      processPayment();
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost text-white hover:bg-white/10"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Pasarela de Pagos</h1>
              <p className="text-slate-400 mt-1">Procesamiento seguro de pagos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <FiShield className="w-5 h-5" />
            <span className="text-sm">Pago Seguro SSL</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resumen del Pago */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-xl p-6 sticky top-8">
              <h3 className="text-xl font-bold text-white mb-6">Resumen del Pago</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-slate-300">
                  <span>Cotización:</span>
                  <span className="font-semibold">{paymentData.quotationNumber}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Cliente:</span>
                  <span className="font-semibold">{paymentData.clientName}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Descripción:</span>
                  <span className="font-semibold">{paymentData.description}</span>
                </div>
                <hr className="border-slate-600" />
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total a Pagar:</span>
                  <span className="text-green-400">{formatAmount(paymentData.amount)}</span>
                </div>
              </div>

              {/* Métodos de Pago Disponibles */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-white mb-4">Métodos de Pago</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <FiCreditCard className="w-6 h-6 text-blue-400" />
                    <span className="text-slate-300">Tarjeta de Crédito/Débito</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600 opacity-50">
                    <FiDollarSign className="w-6 h-6 text-green-400" />
                    <span className="text-slate-300">Transferencia Bancaria</span>
                    <span className="text-xs text-slate-500">(Próximamente)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Pago */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="glass-effect rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FiCreditCard className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">Información de Pago</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información de la Tarjeta */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Datos de la Tarjeta</h3>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-slate-300">Número de Tarjeta *</span>
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="input input-bordered w-full bg-slate-800 border-slate-600 text-white"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-slate-300">Fecha de Expiración *</span>
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          className="input input-bordered w-full bg-slate-800 border-slate-600 text-white"
                          placeholder="MM/AA"
                          maxLength="5"
                          required
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-slate-300">CVV *</span>
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          className="input input-bordered w-full bg-slate-800 border-slate-600 text-white"
                          placeholder="123"
                          maxLength="3"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-slate-300">Nombre del Titular *</span>
                      </label>
                      <input
                        type="text"
                        name="cardholderName"
                        value={formData.cardholderName}
                        onChange={handleInputChange}
                        className="input input-bordered w-full bg-slate-800 border-slate-600 text-white"
                        placeholder="Como aparece en la tarjeta"
                        required
                      />
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Información de Contacto</h3>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-slate-300">Email *</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="input input-bordered w-full bg-slate-800 border-slate-600 text-white"
                        placeholder="correo@ejemplo.com"
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-slate-300">Teléfono</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input input-bordered w-full bg-slate-800 border-slate-600 text-white"
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="btn btn-ghost text-slate-300 hover:text-white"
                    >
                      <FiX className="w-4 h-4 mr-2" />
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FiLock className="w-4 h-4 mr-2" />
                      Procesar Pago
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="glass-effect rounded-xl p-8 text-center">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-6"></div>
                  <h2 className="text-2xl font-bold text-white mb-4">Procesando Pago...</h2>
                  <p className="text-slate-400 mb-6">Por favor no cierres esta ventana</p>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="glass-effect rounded-xl p-8 text-center">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
                    <FiCheck className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">¡Pago Exitoso!</h2>
                  <p className="text-slate-400 mb-6">Tu pago ha sido procesado correctamente</p>
                  
                  <div className="bg-slate-800/50 rounded-lg p-6 mb-8 w-full max-w-md">
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Referencia:</span>
                        <span className="text-white font-mono">PAY-{Date.now().toString().slice(-8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Monto:</span>
                        <span className="text-green-400 font-bold">{formatAmount(paymentData.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fecha:</span>
                        <span className="text-white">{new Date().toLocaleDateString('es-CO')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Volver al Dashboard
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="btn btn-outline border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Imprimir Comprobante
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
