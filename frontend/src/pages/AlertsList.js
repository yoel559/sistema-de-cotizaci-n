import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  FiAlertTriangle,
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
  FiBell,
  FiCreditCard
} from 'react-icons/fi';
import { alertsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SectionHeader from '../components/SectionHeader';

const AlertsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Fetch alerts with pagination
  const { data: alertsData, isLoading, error } = useQuery(
    ['alerts', currentPage, pageSize, statusFilter],
    () => alertsAPI.getAll({ 
      skip: (currentPage - 1) * pageSize, 
      limit: pageSize
    }),
    {
      refetchInterval: 30000,
    }
  );

  const alerts = Array.isArray(alertsData?.data) ? alertsData.data : [];
  const totalPages = Math.ceil((alertsData?.total || 0) / pageSize);

  // Filter alerts based on search
  const filteredAlerts = alerts.filter(alert => 
    alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.cotizacion?.numero_cotizacion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await alertsAPI.markAsRead(alertId);
      window.location.reload();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: 'badge-warning',
      atendida: 'badge-success',
      vencida: 'badge-error'
    };
    return colors[status] || 'badge-neutral';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pendiente: FiClock,
      atendida: FiCheckCircle,
      vencida: FiAlertTriangle
    };
    return icons[status] || FiBell;
  };

  const isOverdue = (fechaAlerta) => {
    return new Date(fechaAlerta) < new Date();
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
        <FiAlertTriangle className="w-5 h-5" />
        <span>Error al cargar las alertas</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Alertas</h1>
          <p className="text-base-content/60 mt-1">
            Gestiona todas las alertas del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/alerts/create" className="btn btn-primary">
            <FiPlus className="w-4 h-4 mr-2" />
            Nueva Alerta
          </Link>
        </div>
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
                  placeholder="Buscar por mensaje o número de cotización..."
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
                <option value="pendiente">Pendiente</option>
                <option value="atendida">Atendida</option>
                <option value="vencida">Vencida</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <SectionHeader
        title="Lista de Alertas"
        subtitle={`${filteredAlerts.length} alertas encontradas`}
        count={filteredAlerts.length}
        showFilters={false}
      />

      {/* Alerts List */}
      {filteredAlerts.length > 0 ? (
        <>
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const StatusIcon = getStatusIcon(alert.estado_alerta);
              const overdue = isOverdue(alert.fecha_alerta);
              
              return (
                <div 
                  key={alert.id_alerta} 
                  className={`card shadow-lg transition-all hover:shadow-xl ${
                    overdue && alert.estado_alerta === 'pendiente' 
                      ? 'bg-error/5 border-error/20' 
                      : 'bg-base-100'
                  }`}
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`avatar placeholder ${
                          overdue && alert.estado_alerta === 'pendiente' ? 'text-error' : 'text-primary'
                        }`}>
                          <div className={`rounded-full w-12 ${
                            overdue && alert.estado_alerta === 'pendiente' 
                              ? 'bg-error text-error-content' 
                              : 'bg-primary text-primary-content'
                          }`}>
                            <StatusIcon className="w-6 h-6" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="card-title text-lg">
                              {alert.cotizacion?.numero_cotizacion || 'Sin cotización'}
                            </h3>
                            <span className={`badge ${getStatusColor(alert.estado_alerta)}`}>
                              {alert.estado_alerta}
                            </span>
                            {overdue && alert.estado_alerta === 'pendiente' && (
                              <span className="badge badge-error">
                                Vencida
                              </span>
                            )}
                          </div>
                          
                          <p className="text-base-content/80 mb-3">
                            {alert.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-base-content/60">
                            <div className="flex items-center gap-1">
                              <FiCalendar className="w-4 h-4" />
                              <span>
                                Fecha: {new Date(alert.fecha_alerta).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiClock className="w-4 h-4" />
                              <span>
                                Creada: {new Date(alert.fecha_creacion).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {alert.estado_alerta === 'pendiente' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleMarkAsRead(alert.id_alerta)}
                          >
                            <FiCheckCircle className="w-4 h-4 mr-1" />
                            Marcar como Atendida
                          </button>
                        )}
                        <Link 
                          to={`/alerts/${alert.id_alerta}`}
                          className="btn btn-ghost btn-sm"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/alerts/${alert.id_alerta}/edit`}
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
          <FiBell className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-base-content/60 mb-2">
            No se encontraron alertas
          </h3>
          <p className="text-base-content/40 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay alertas en el sistema'
            }
          </p>
          <Link to="/alerts/create" className="btn btn-primary">
            <FiPlus className="w-4 h-4 mr-2" />
            Crear Alerta
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-warning/10 rounded-lg p-4">
          <div className="stat-title text-warning">Pendientes</div>
          <div className="stat-value text-warning">
            {alerts.filter(a => a.estado_alerta === 'pendiente').length}
          </div>
        </div>
        <div className="stat bg-success/10 rounded-lg p-4">
          <div className="stat-title text-success">Atendidas</div>
          <div className="stat-value text-success">
            {alerts.filter(a => a.estado_alerta === 'atendida').length}
          </div>
        </div>
        <div className="stat bg-error/10 rounded-lg p-4">
          <div className="stat-title text-error">Vencidas</div>
          <div className="stat-value text-error">
            {alerts.filter(a => isOverdue(a.fecha_alerta) && a.estado_alerta === 'pendiente').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsList;
