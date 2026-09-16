import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  FiTruck,
  FiPlus,
  FiSearch,
  FiEdit,
  FiEye,
  FiPackage,
  FiCalendar,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle
} from 'react-icons/fi';
import { inventoryAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SectionHeader from '../components/SectionHeader';

const InventoryList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Fetch vehicles with pagination
  const { data: vehiclesData, isLoading, error } = useQuery(
    ['vehicles', currentPage, pageSize, statusFilter],
    () => inventoryAPI.getVehicles({ 
      skip: (currentPage - 1) * pageSize, 
      limit: pageSize
    }),
    {
      refetchInterval: 30000,
    }
  );

  const vehicles = Array.isArray(vehiclesData?.data) ? vehiclesData.data : (Array.isArray(vehiclesData) ? vehiclesData : []);
  const totalPages = Math.ceil((vehiclesData?.total || vehicles.length) / pageSize);
  
  // Aplicar filtro de estado
  const statusFilteredVehicles = statusFilter === 'all' 
    ? vehicles 
    : vehicles.filter(v => {
        if (statusFilter === 'disponible') return v.available === true;
        if (statusFilter === 'no_disponible') return v.available === false;
        return true;
      });

  // Filter vehicles based on search
  const filteredVehicles = statusFilteredVehicles.filter(vehicle => {
    if (!vehicle) return false;
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const vin = (vehicle.vin || '').toLowerCase();
    const model = (vehicle.model || '').toLowerCase();
    const color = (vehicle.color || '').toLowerCase();
    
    return vin.includes(searchLower) || 
           model.includes(searchLower) || 
           color.includes(searchLower);
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status) => {
    const colors = {
      disponible: 'badge-success',
      asignado: 'badge-warning',
      entregado: 'badge-info',
      mantenimiento: 'badge-error'
    };
    return colors[status] || 'badge-neutral';
  };

  const getStatusIcon = (status) => {
    const icons = {
      disponible: FiCheckCircle,
      asignado: FiClock,
      entregado: FiPackage,
      mantenimiento: FiAlertTriangle
    };
    return icons[status] || FiTruck;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <FiTruck className="w-5 h-5" />
        <span>Error al cargar el inventario</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Inventario</h1>
          <p className="text-base-content/60 mt-1">
            Gestiona el inventario de vehículos
          </p>
        </div>
        <Link to="/inventory/create" className="btn btn-primary">
          <FiPlus className="w-4 h-4 mr-2" />
          Agregar Vehículo
        </Link>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por VIN, modelo o color..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="form-control">
              <select 
                className="select select-bordered"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los Estados</option>
                <option value="disponible">Disponible</option>
                <option value="no_disponible">No Disponible</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <SectionHeader
        title="Inventario de Vehículos"
        subtitle={`${filteredVehicles.length} vehículos encontrados`}
        count={filteredVehicles.length}
        showFilters={false}
      />

      {/* Vehicles Grid */}
      {filteredVehicles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVehicles.map((vehicle) => {
              const vehicleStatus = vehicle.available ? 'disponible' : 'asignado';
              const StatusIcon = getStatusIcon(vehicleStatus);
              return (
                <div key={vehicle.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-4">
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-full w-12">
                          <FiTruck className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Link 
                          to={`/inventory/${vehicle.id}`}
                          className="btn btn-ghost btn-xs"
                        >
                          <FiEye className="w-3 h-3" />
                        </Link>
                        <Link 
                          to={`/inventory/${vehicle.id}/edit`}
                          className="btn btn-ghost btn-xs"
                        >
                          <FiEdit className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    <h3 className="card-title text-lg mb-2">
                      {vehicle.marca ? `${vehicle.marca} ${vehicle.model || ''}`.trim() : (vehicle.model || 'Sin modelo')}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      {vehicle.marca && (
                        <div className="flex items-center gap-2 text-base-content/60">
                          <FiTruck className="w-4 h-4" />
                          <span className="truncate">Marca: {vehicle.marca}</span>
                        </div>
                      )}
                      {vehicle.model && (
                        <div className="flex items-center gap-2 text-base-content/60">
                          <FiTruck className="w-4 h-4" />
                          <span className="truncate">Modelo: {vehicle.model}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-base-content/60">
                        <FiTruck className="w-4 h-4" />
                        <span className="truncate">VIN: {vehicle.vin || 'N/A'}</span>
                      </div>
                      {vehicle.color && (
                        <div className="flex items-center gap-2 text-base-content/60">
                          <FiTruck className="w-4 h-4" />
                          <span>Color: {vehicle.color}</span>
                        </div>
                      )}
                      {vehicle.precio && (
                        <div className="flex items-center gap-2 text-base-content/60">
                          <FiDollarSign className="w-4 h-4" />
                          <span className="font-semibold text-primary">
                            Precio: ${parseFloat(vehicle.precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <StatusIcon className="w-4 h-4" />
                        <span className={`badge ${getStatusColor(vehicle.available ? 'disponible' : 'asignado')}`}>
                          {vehicle.available ? 'Disponible' : 'No Disponible'}
                        </span>
                      </div>
                      {vehicle.image_url && (
                        <div className="mt-2">
                          <img 
                            src={vehicle.image_url.startsWith('http') ? vehicle.image_url : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${vehicle.image_url}`}
                            alt={vehicle.model}
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="card-actions justify-end mt-4">
                      <Link 
                        to={`/inventory/${vehicle.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <div className="btn-group">
                <button
                  className="btn btn-outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`btn ${currentPage === page ? 'btn-active' : 'btn-outline'}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  className="btn btn-outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <FiTruck className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-base-content/60 mb-2">
            No se encontraron vehículos
          </h3>
          <p className="text-base-content/40 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primer vehículo al inventario'
            }
          </p>
          <Link to="/inventory/create" className="btn btn-primary">
            <FiPlus className="w-4 h-4 mr-2" />
            Agregar Vehículo
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat bg-success/10 rounded-lg p-4">
          <div className="stat-title text-success">Disponibles</div>
          <div className="stat-value text-success">
            {vehicles.filter(v => v.available === true).length}
          </div>
        </div>
        <div className="stat bg-warning/10 rounded-lg p-4">
          <div className="stat-title text-warning">No Disponibles</div>
          <div className="stat-value text-warning">
            {vehicles.filter(v => v.available === false).length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryList;
