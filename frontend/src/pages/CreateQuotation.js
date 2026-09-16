import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiUser, FiTruck, FiDollarSign, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { quotationsAPI, clientsAPI, inventoryAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const CreateQuotation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    id_cliente: '',
    vehiculo: '',
    vehicle_id: '',
    estado: 'frio',
    fecha_seguimiento: '',
    tipo_pago: 'contado'
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Fetch clients for dropdown
  const { data: clientsData, isLoading: clientsLoading } = useQuery(
    'clients-for-quotation',
    () => clientsAPI.getAll({ limit: 1000 }),
    {
      enabled: true,
    }
  );

  // Fetch vehicles from inventory
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery(
    'vehicles-for-quotation',
    () => inventoryAPI.getVehicles({ limit: 1000 }),
    {
      enabled: true,
    }
  );

  const clients = Array.isArray(clientsData?.data) ? clientsData.data : [];
  const vehicles = Array.isArray(vehiclesData?.data) ? vehiclesData.data : (Array.isArray(vehiclesData) ? vehiclesData : []);

  // Create quotation mutation
  const createQuotationMutation = useMutation(
    (quotationData) => quotationsAPI.create(quotationData),
    {
      onSuccess: () => {
        toast.success('Cotización creada exitosamente');
        queryClient.invalidateQueries('quotationsData');
        navigate('/quotations');
      },
      onError: (error) => {
        // Mejorar el manejo de errores para mostrar mensajes más claros
        let errorMessage = 'Error al crear cotización';
        
        if (error.response?.data) {
          const errorData = error.response.data;
          
          // Si detail es un string, usarlo directamente
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
          // Si detail es un array, unir los mensajes
          else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail
              .map(err => {
                if (typeof err === 'string') return err;
                if (err.msg) return err.msg;
                return JSON.stringify(err);
              })
              .join(', ');
          }
          // Si detail es un objeto, intentar extraer el mensaje
          else if (typeof errorData.detail === 'object') {
            errorMessage = errorData.detail.message || errorData.detail.msg || JSON.stringify(errorData.detail);
          }
          // Si hay un mensaje general
          else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.error('Error al crear cotización:', error);
        toast.error(errorMessage);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar que el usuario esté disponible
    const userId = user?.id_usuario || user?.id;
    if (!user || !userId) {
      toast.error('No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.');
      return;
    }
    
    // Validar que se haya seleccionado un vehículo
    if (!formData.vehicle_id || !selectedVehicle) {
      toast.error('Por favor, selecciona un vehículo del inventario.');
      return;
    }
    
    // Preparar los datos con todos los campos requeridos
    const quotationData = {
      id_cliente: parseInt(formData.id_cliente),
      id_usuario: userId,
      vehiculo: formData.vehiculo,
      estado: formData.estado,
      fecha_registro: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
      fecha_seguimiento: formData.fecha_seguimiento || new Date().toISOString().split('T')[0],
      tipo_pago: formData.tipo_pago || 'contado'
    };
    
    createQuotationMutation.mutate(quotationData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVehicleChange = (e) => {
    const vehicleId = e.target.value;
    const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
    
    setSelectedVehicle(vehicle);
    setFormData(prev => ({
      ...prev,
      vehicle_id: vehicleId,
      vehiculo: vehicle ? `${vehicle.model}${vehicle.vin ? ` - VIN: ${vehicle.vin}` : ''}${vehicle.color ? ` - Color: ${vehicle.color}` : ''}${vehicle.precio ? ` - Precio: $${parseFloat(vehicle.precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}` : ''
    }));
  };

  if (clientsLoading || vehiclesLoading) {
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
          onClick={() => navigate('/quotations')}
          className="btn btn-ghost btn-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Cotización</h1>
          <p className="text-base-content/60">Crear una nueva cotización</p>
        </div>
      </div>

      {/* Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cliente */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  <FiUser className="w-4 h-4 inline mr-2" />
                  Cliente
                </span>
              </label>
              <select
                name="id_cliente"
                value={formData.id_cliente}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id_cliente} value={client.id_cliente}>
                    {client.nombre} {client.apellidos}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehículo */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  <FiTruck className="w-4 h-4 inline mr-2" />
                  Seleccionar Vehículo del Inventario
                </span>
              </label>
              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleVehicleChange}
                className="select select-bordered"
                required
              >
                <option value="">Seleccionar vehículo</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.model || 'Sin modelo'} {vehicle.vin ? `- VIN: ${vehicle.vin}` : ''} {vehicle.precio ? `- $${parseFloat(vehicle.precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                  </option>
                ))}
              </select>
              {vehicles.length === 0 && (
                <label className="label">
                  <span className="label-text-alt text-warning">
                    No hay vehículos en el inventario. <a href="/inventory/create" className="link link-primary">Agregar vehículo</a>
                  </span>
                </label>
              )}
            </div>

            {/* Información del Vehículo Seleccionado */}
            {selectedVehicle && (
              <div className="card bg-transparent border border-base-content/20 shadow-md">
                <div className="card-body">
                  <h3 className="card-title text-lg mb-4">
                    <FiTruck className="w-5 h-5" />
                    Información del Vehículo Seleccionado
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base-content/70">Modelo:</span>
                        <span className="text-base-content">{selectedVehicle.model || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base-content/70">VIN:</span>
                        <span className="text-base-content">{selectedVehicle.vin || 'N/A'}</span>
                      </div>
                      {selectedVehicle.color && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base-content/70">Color:</span>
                          <span className="text-base-content">{selectedVehicle.color}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selectedVehicle.precio && (
                        <div className="flex items-center gap-2">
                          <FiDollarSign className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-base-content/70">Precio:</span>
                          <span className="text-primary font-bold text-lg">
                            ${parseFloat(selectedVehicle.precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base-content/70">Disponibilidad:</span>
                        {selectedVehicle.available ? (
                          <span className="badge badge-success gap-1">
                            <FiCheckCircle className="w-3 h-3" />
                            Disponible
                          </span>
                        ) : (
                          <span className="badge badge-warning gap-1">
                            <FiXCircle className="w-3 h-3" />
                            No Disponible
                          </span>
                        )}
                      </div>
                      {selectedVehicle.image_url && (
                        <div className="mt-2 flex justify-center">
                          <img 
                            src={selectedVehicle.image_url.startsWith('http') ? selectedVehicle.image_url : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${selectedVehicle.image_url}`}
                            alt={selectedVehicle.model}
                            className="max-w-full h-24 object-contain rounded"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}


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
                <option value="frio">Frío</option>
                <option value="tibio">Tibio</option>
                <option value="caliente">Caliente</option>
              </select>
            </div>

            {/* Fecha de seguimiento */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Fecha de Seguimiento</span>
              </label>
              <input
                type="date"
                name="fecha_seguimiento"
                value={formData.fecha_seguimiento}
                onChange={handleChange}
                className="input input-bordered"
              />
            </div>

            {/* Tipo de Pago */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  <FiDollarSign className="w-4 h-4 inline mr-2" />
                  Tipo de Pago
                </span>
              </label>
              <select
                name="tipo_pago"
                value={formData.tipo_pago}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="contado">Contado (Pago Completo)</option>
                <option value="financiado">Financiado (50% de enganche)</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  {formData.tipo_pago === 'financiado' 
                    ? 'El cliente pagará el 50% de enganche y el resto será financiado'
                    : 'El cliente realizará el pago completo al momento de la compra'}
                </span>
              </label>
            </div>

            {/* Información del tipo de pago seleccionado */}
            {selectedVehicle && selectedVehicle.precio && (
              <div className="alert alert-info">
                <FiDollarSign className="w-5 h-5" />
                <div>
                  <h3 className="font-bold">Resumen de Pago</h3>
                  <div className="text-sm mt-1">
                    <p><strong>Precio del Vehículo:</strong> ${parseFloat(selectedVehicle.precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    {formData.tipo_pago === 'financiado' ? (
                      <p><strong>Enganche (50%):</strong> ${(parseFloat(selectedVehicle.precio) * 0.5).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    ) : (
                      <p><strong>Pago Total:</strong> ${parseFloat(selectedVehicle.precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="form-control pt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createQuotationMutation.isLoading}
              >
                {createQuotationMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Crear Cotización
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

export default CreateQuotation;
