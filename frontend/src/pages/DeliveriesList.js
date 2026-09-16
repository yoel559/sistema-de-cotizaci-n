import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  FiPackage,
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiTruck,
  FiMapPin
} from 'react-icons/fi';
import { inventoryAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SectionHeader from '../components/SectionHeader';

const DeliveriesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Fetch deliveries with pagination
  const { data: deliveriesData, isLoading, error } = useQuery(
    ['deliveries', currentPage, pageSize, statusFilter],
    () => inventoryAPI.getDeliveries({ 
      skip: (currentPage - 1) * pageSize, 
      limit: pageSize
    }),
    {
      refetchInterval: 30000,
    }
  );

  const deliveries = Array.isArray(deliveriesData?.data) ? deliveriesData.data : [];
  const totalPages = Math.ceil((deliveriesData?.total || 0) / pageSize);

  // Filter deliveries based on search
  const filteredDeliveries = deliveries.filter(delivery => 
    delivery.cotizacion?.numero_cotizacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.vehiculo?.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status) => {
    const colors = {
      programada: 'badge-warning',
      en_camino: 'badge-info',
      entregada: 'badge-success',
      cancelada: 'badge-error'
    };
    return colors[status] || 'badge-neutral';
  };

  const getStatusIcon = (status) => {
    const icons = {
      programada: FiClock,
      en_camino: FiTruck,
      entregada: FiCheckCircle,
      cancelada: FiTrash2
    };
    return icons[status] || FiPackage;
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
        <FiPackage className="w-5 h-5" />
        <span>Error al cargar las entregas</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Entregas</h1>
          <p className="text-base-content/60 mt-1">
            Gestiona las entregas de vehículos
          </p>
        </div>
        <Link to="/deliveries/create" className="btn btn-primary">
          <FiPlus className="w-4 h-4 mr-2" />
          Nueva Entrega
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
                  placeholder="Buscar por cotización, cliente o vehículo..."
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
                <option value="programada">Programada</option>
                <option value="en_camino">En Camino</option>
                <option value="entregada">Entregada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <SectionHeader
        title="Lista de Entregas"
        subtitle={`${filteredDeliveries.length} entregas encontradas`}
        count={filteredDeliveries.length}
        showFilters={false}
      />

      {/* Deliveries List */}
      {filteredDeliveries.length > 0 ? (
        <>
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => {
              const StatusIcon = getStatusIcon(delivery.status);
              
              return (
                <div key={delivery.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="avatar placeholder text-primary">
                          <div className="bg-primary text-primary-content rounded-full w-12">
                            <StatusIcon className="w-6 h-6" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="card-title text-lg">
                              {delivery.cotizacion?.numero_cotizacion || 'Sin cotización'}
                            </h3>
                            <span className={`badge ${getStatusColor(delivery.status)}`}>
                              {delivery.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiUser className="w-4 h-4" />
                              <span>{delivery.cliente?.nombre || 'Sin cliente'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiTruck className="w-4 h-4" />
                              <span>{delivery.vehiculo?.marca} {delivery.vehiculo?.modelo}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiCalendar className="w-4 h-4" />
                              <span>
                                Fecha: {new Date(delivery.delivery_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiMapPin className="w-4 h-4" />
                              <span className="truncate">{delivery.delivery_address}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link 
                          to={`/deliveries/${delivery.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/deliveries/${delivery.id}/edit`}
                          className="btn btn-ghost btn-sm"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button className="btn btn-ghost btn-sm text-error">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
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
          <FiPackage className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-base-content/60 mb-2">
            No se encontraron entregas
          </h3>
          <p className="text-base-content/40 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay entregas programadas en el sistema'
            }
          </p>
          <Link to="/deliveries/create" className="btn btn-primary">
            <FiPlus className="w-4 h-4 mr-2" />
            Programar Entrega
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-warning/10 rounded-lg p-4">
          <div className="stat-title text-warning">Programadas</div>
          <div className="stat-value text-warning">
            {deliveries.filter(d => d.status === 'programada').length}
          </div>
        </div>
        <div className="stat bg-info/10 rounded-lg p-4">
          <div className="stat-title text-info">En Camino</div>
          <div className="stat-value text-info">
            {deliveries.filter(d => d.status === 'en_camino').length}
          </div>
        </div>
        <div className="stat bg-success/10 rounded-lg p-4">
          <div className="stat-title text-success">Entregadas</div>
          <div className="stat-value text-success">
            {deliveries.filter(d => d.status === 'entregada').length}
          </div>
        </div>
        <div className="stat bg-error/10 rounded-lg p-4">
          <div className="stat-title text-error">Canceladas</div>
          <div className="stat-value text-error">
            {deliveries.filter(d => d.status === 'cancelada').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveriesList;
