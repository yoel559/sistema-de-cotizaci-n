import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  FiDollarSign,
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
  FiCreditCard
} from 'react-icons/fi';
import { paymentsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SectionHeader from '../components/SectionHeader';

const PaymentsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Fetch payment schedules with pagination
  const { data: paymentsData, isLoading, error } = useQuery(
    ['payment-schedules', currentPage, pageSize, statusFilter],
    () => paymentsAPI.getSchedules({ 
      skip: (currentPage - 1) * pageSize, 
      limit: pageSize
    }),
    {
      refetchInterval: 30000,
    }
  );

  // El backend devuelve directamente un array, no un objeto con data
  const schedules = Array.isArray(paymentsData) ? paymentsData : (Array.isArray(paymentsData?.data) ? paymentsData.data : []);
  const totalPages = Math.ceil(schedules.length / pageSize);

  // Filter schedules based on search
  const filteredSchedules = schedules.filter(schedule => {
    const cotizacionNum = schedule.cotizacion?.numero_cotizacion?.toLowerCase() || '';
    const clienteNombre = schedule.cotizacion?.cliente?.nombre?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    return cotizacionNum.includes(searchLower) || clienteNombre.includes(searchLower);
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status) => {
    const colors = {
      activo: 'badge-success',
      completado: 'badge-info',
      vencido: 'badge-error',
      suspendido: 'badge-warning'
    };
    return colors[status] || 'badge-neutral';
  };

  const getStatusIcon = (status) => {
    const icons = {
      activo: FiCheckCircle,
      completado: FiCheckCircle,
      vencido: FiClock,
      suspendido: FiClock
    };
    return icons[status] || FiDollarSign;
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
        <FiDollarSign className="w-5 h-5" />
        <span>Error al cargar los cronogramas de pago</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Pagos</h1>
          <p className="text-base-content/60 mt-1">
            Gestiona los cronogramas de pago
          </p>
        </div>
        <Link to="/billing/create" className="btn btn-primary">
          <FiPlus className="w-4 h-4 mr-2" />
          Nuevo Cronograma
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
                  placeholder="Buscar por cotización o cliente..."
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
                <option value="activo">Activo</option>
                <option value="completado">Completado</option>
                <option value="vencido">Vencido</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <SectionHeader
        title="Cronogramas de Pago"
        subtitle={`${filteredSchedules.length} cronogramas encontrados`}
        count={filteredSchedules.length}
        showFilters={false}
      />

      {/* Schedules List */}
      {filteredSchedules.length > 0 ? (
        <>
          <div className="space-y-4">
            {filteredSchedules.map((schedule) => {
              const StatusIcon = getStatusIcon(schedule.status);
              
              return (
                <div key={schedule.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
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
                              {schedule.cotizacion?.numero_cotizacion || 'Sin cotización'}
                            </h3>
                            <span className={`badge ${getStatusColor(schedule.status)}`}>
                              {schedule.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiUser className="w-4 h-4" />
                              <span>{schedule.cotizacion?.cliente?.nombre || schedule.cotizacion?.cliente?.nombre || 'Sin cliente'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiDollarSign className="w-4 h-4" />
                              <span>Monto: ${schedule.amount_due?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiCalendar className="w-4 h-4" />
                              <span>
                                Vence: {schedule.due_date ? new Date(schedule.due_date).toLocaleDateString('es-ES') : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiCreditCard className="w-4 h-4" />
                              <span>Cuota #{schedule.installment_number}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link 
                          to={`/payments/${schedule.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/payments/${schedule.id}/edit`}
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
          <FiDollarSign className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-base-content/60 mb-2">
            No se encontraron cronogramas
          </h3>
          <p className="text-base-content/40 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay cronogramas de pago en el sistema'
            }
          </p>
          <Link to="/billing/create" className="btn btn-primary">
            <FiPlus className="w-4 h-4 mr-2" />
            Crear Cronograma
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-success/10 rounded-lg p-4">
          <div className="stat-title text-success">Activos</div>
          <div className="stat-value text-success">
            {schedules.filter(s => s.status === 'activo').length}
          </div>
        </div>
        <div className="stat bg-info/10 rounded-lg p-4">
          <div className="stat-title text-info">Completados</div>
          <div className="stat-value text-info">
            {schedules.filter(s => s.status === 'completado').length}
          </div>
        </div>
        <div className="stat bg-warning/10 rounded-lg p-4">
          <div className="stat-title text-warning">Suspendidos</div>
          <div className="stat-value text-warning">
            {schedules.filter(s => s.status === 'suspendido').length}
          </div>
        </div>
        <div className="stat bg-error/10 rounded-lg p-4">
          <div className="stat-title text-error">Vencidos</div>
          <div className="stat-value text-error">
            {schedules.filter(s => s.status === 'vencido').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsList;
