import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  FiCreditCard, 
  FiPlus, 
  FiSearch, 
  FiEdit,
  FiTrash2,
  FiEye,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiFileText
} from 'react-icons/fi';
import { creditAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SectionHeader from '../components/SectionHeader';

const CreditList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Fetch credit applications with pagination
  const { data: creditData, isLoading, error } = useQuery(
    ['credit-applications', currentPage, pageSize, statusFilter],
    () => creditAPI.getApplications({ 
      skip: (currentPage - 1) * pageSize, 
      limit: pageSize
    }),
    {
      refetchInterval: 30000,
    }
  );

  const applications = Array.isArray(creditData?.data) ? creditData.data : [];
  const totalPages = Math.ceil((creditData?.total || 0) / pageSize);

  // Filter applications based on search
  const filteredApplications = applications.filter(app => 
    app.cotizacion?.numero_cotizacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: 'badge-warning',
      aprobado: 'badge-success',
      rechazado: 'badge-error',
      en_revision: 'badge-info'
    };
    return colors[status] || 'badge-neutral';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pendiente: FiClock,
      aprobado: FiCheckCircle,
      rechazado: FiTrash2,
      en_revision: FiEye
    };
    return icons[status] || FiCreditCard;
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
        <FiCreditCard className="w-5 h-5" />
        <span>Error al cargar las solicitudes de crédito</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Créditos</h1>
          <p className="text-base-content/60 mt-1">
            Gestiona las solicitudes de crédito
          </p>
        </div>
        <Link to="/credit/create" className="btn btn-primary">
          <FiPlus className="w-4 h-4 mr-2" />
          Nueva Solicitud
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
                <option value="pendiente">Pendiente</option>
                <option value="en_revision">En Revisión</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <SectionHeader
        title="Solicitudes de Crédito"
        subtitle={`${filteredApplications.length} solicitudes encontradas`}
        count={filteredApplications.length}
        showFilters={false}
      />

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <>
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const StatusIcon = getStatusIcon(application.status);
              
              return (
                <div key={application.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
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
                              {application.cotizacion?.numero_cotizacion || 'Sin cotización'}
                            </h3>
                            <span className={`badge ${getStatusColor(application.status)}`}>
                              {application.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiUser className="w-4 h-4" />
                              <span>{application.cliente?.nombre || 'Sin cliente'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiDollarSign className="w-4 h-4" />
                              <span>Monto: ${application.requested_amount?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiCalendar className="w-4 h-4" />
                              <span>
                                Fecha: {new Date(application.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-base-content/60">
                              <FiFileText className="w-4 h-4" />
                              <span>Tipo: {application.credit_type}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link 
                          to={`/credit/${application.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/credit/${application.id}/edit`}
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
          <FiCreditCard className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-base-content/60 mb-2">
            No se encontraron solicitudes
          </h3>
          <p className="text-base-content/40 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay solicitudes de crédito en el sistema'
            }
          </p>
          <Link to="/credit/create" className="btn btn-primary">
            <FiPlus className="w-4 h-4 mr-2" />
            Crear Solicitud
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-warning/10 rounded-lg p-4">
          <div className="stat-title text-warning">Pendientes</div>
          <div className="stat-value text-warning">
            {applications.filter(a => a.status === 'pendiente').length}
          </div>
        </div>
        <div className="stat bg-info/10 rounded-lg p-4">
          <div className="stat-title text-info">En Revisión</div>
          <div className="stat-value text-info">
            {applications.filter(a => a.status === 'en_revision').length}
          </div>
        </div>
        <div className="stat bg-success/10 rounded-lg p-4">
          <div className="stat-title text-success">Aprobadas</div>
          <div className="stat-value text-success">
            {applications.filter(a => a.status === 'aprobado').length}
          </div>
        </div>
        <div className="stat bg-error/10 rounded-lg p-4">
          <div className="stat-title text-error">Rechazadas</div>
          <div className="stat-value text-error">
            {applications.filter(a => a.status === 'rechazado').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditList;
