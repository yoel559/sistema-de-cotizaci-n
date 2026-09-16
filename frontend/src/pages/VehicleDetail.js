import React from 'react';
import { useQuery } from 'react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiImage,
  FiDollarSign
} from 'react-icons/fi';
import { inventoryAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Validar que el ID sea válido
  const isValidId = id && typeof id === 'string' && !isNaN(parseInt(id)) && parseInt(id) > 0;
  const vehicleId = isValidId ? parseInt(id) : null;

  // Fetch vehicle details
  const { data: vehicle, isLoading, error } = useQuery(
    ['vehicle', vehicleId],
    () => inventoryAPI.getVehicleById(vehicleId),
    {
      enabled: isValidId && !!vehicleId,
      select: (response) => {
        // React Query automáticamente extrae response.data, pero verificamos por si acaso
        const data = response?.data || response;
        console.log('Datos del vehículo recibidos:', data);
        return data;
      },
      onSuccess: (data) => {
        console.log('Vehículo cargado exitosamente:', data);
      },
      onError: (err) => {
        console.error('Error cargando vehículo:', err);
        console.error('Error response:', err.response);
      }
    }
  );

  if (!isValidId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/inventory" className="btn btn-ghost">
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inventario
          </Link>
        </div>
        <div className="alert alert-error">
          <FiXCircle className="w-5 h-5" />
          <span>ID de vehículo inválido</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/inventory" className="btn btn-ghost">
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inventario
          </Link>
        </div>
        <div className="alert alert-error">
          <FiXCircle className="w-5 h-5" />
          <span>
            {error.response?.data?.detail || error.message || 'Error al cargar el vehículo'}
          </span>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/inventory" className="btn btn-ghost">
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inventario
          </Link>
        </div>
        <div className="alert alert-warning">
          <FiXCircle className="w-5 h-5" />
          <span>Vehículo no encontrado</span>
        </div>
      </div>
    );
  }

  const imageUrl = vehicle.image_url 
    ? (vehicle.image_url.startsWith('http') 
        ? vehicle.image_url 
        : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${vehicle.image_url}`)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/inventory" className="btn btn-ghost">
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inventario
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-base-content">Detalles del Vehículo</h1>
            <p className="text-base-content/60 mt-1">Información completa del vehículo</p>
          </div>
        </div>
        <Link 
          to={`/inventory/${vehicle.id}/edit`}
          className="btn btn-primary"
        >
          <FiEdit className="w-4 h-4 mr-2" />
          Editar
        </Link>
      </div>

      {/* Vehicle Card */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Image */}
            <div>
              {imageUrl ? (
                <div className="w-full">
                  <img 
                    src={imageUrl}
                    alt={vehicle.model}
                    className="w-full h-96 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-96 bg-base-200 rounded-lg items-center justify-center">
                    <FiImage className="w-16 h-16 text-base-content/30" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-96 bg-base-200 rounded-lg flex items-center justify-center">
                  <FiImage className="w-16 h-16 text-base-content/30" />
                  <span className="ml-2 text-base-content/50">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Marca y Modelo */}
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#2E1F1C', fontWeight: '700' }}>
                  {vehicle.marca ? `${vehicle.marca} ${vehicle.model || ''}`.trim() : (vehicle.model || 'Sin modelo')}
                </h2>
                <div className={`badge ${vehicle.available ? 'badge-success' : 'badge-warning'} badge-lg`}>
                  {vehicle.available ? (
                    <>
                      <FiCheckCircle className="w-4 h-4 mr-1" />
                      Disponible
                    </>
                  ) : (
                    <>
                      <FiXCircle className="w-4 h-4 mr-1" />
                      No Disponible
                    </>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-4">
                {/* Marca */}
                {vehicle.marca && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-base-content/20">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FiTruck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#9ca3af', fontWeight: '500' }}>Marca</p>
                      <p className="font-semibold text-lg" style={{ color: '#2E1F1C', fontWeight: '600' }}>{vehicle.marca}</p>
                    </div>
                  </div>
                )}

                {/* Modelo */}
                {vehicle.model && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-base-content/20">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FiTruck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#9ca3af', fontWeight: '500' }}>Modelo</p>
                      <p className="font-semibold text-lg" style={{ color: '#2E1F1C', fontWeight: '600' }}>{vehicle.model}</p>
                    </div>
                  </div>
                )}

                {/* VIN */}
                <div className="flex items-center gap-3 p-4 rounded-lg border border-base-content/20">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <FiTruck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#9ca3af', fontWeight: '500' }}>VIN</p>
                    <p className="font-semibold text-lg" style={{ color: '#2E1F1C', fontWeight: '600' }}>{vehicle.vin || 'N/A'}</p>
                  </div>
                </div>

                {/* Color */}
                {vehicle.color && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-base-content/20">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FiTruck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#9ca3af', fontWeight: '500' }}>Color</p>
                      <p className="font-semibold text-lg" style={{ color: '#2E1F1C', fontWeight: '600' }}>{vehicle.color}</p>
                    </div>
                  </div>
                )}

                {/* Precio */}
                {vehicle.precio && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-base-content/20">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FiDollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#9ca3af', fontWeight: '500' }}>Precio</p>
                      <p className="font-semibold text-lg" style={{ color: '#2E1F1C', fontWeight: '600' }}>
                        ${parseFloat(vehicle.precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Created At */}
                {vehicle.created_at && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-base-content/20">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FiCalendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#9ca3af', fontWeight: '500' }}>Fecha de Registro</p>
                      <p className="font-semibold text-lg" style={{ color: '#2E1F1C', fontWeight: '600' }}>
                        {new Date(vehicle.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* ID */}
                <div className="flex items-center gap-3 p-4 rounded-lg border border-base-content/20">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <FiTruck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#9ca3af', fontWeight: '500' }}>ID</p>
                    <p className="font-semibold text-lg" style={{ color: '#2E1F1C', fontWeight: '600' }}>#{vehicle.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;


