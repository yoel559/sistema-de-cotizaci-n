import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiEdit,
  FiEye,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiFileText
} from 'react-icons/fi';
import { clientsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ClientsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Fetch clients with pagination
  const { data: clientsData, isLoading, error } = useQuery(
    ['clients', currentPage, pageSize],
    () => clientsAPI.getAll({ 
      skip: (currentPage - 1) * pageSize, 
      limit: pageSize
    }),
    {
      refetchInterval: 30000,
    }
  );

  const clients = Array.isArray(clientsData?.data) ? clientsData.data : [];
  const totalPages = Math.ceil((clientsData?.total || 0) / pageSize);

  // Filter clients based on search
  const filteredClients = clients.filter(client => 
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <FiUsers className="w-5 h-5" />
        <span>Error al cargar los clientes</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient animate-fade-in-left">
            Clientes
          </h1>
          <p className="text-slate-400 mt-2 animate-fade-in-left" style={{ animationDelay: '0.1s' }}>
            Gestiona todos los clientes del sistema
          </p>
        </div>
        <Link
          to="/clients/create"
          className="btn btn-modern text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-right"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Nuevo Cliente
        </Link>
      </div>

      {/* Search and Stats */}
      <div className="glass-effect rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Total de clientes</p>
              <p className="text-2xl font-bold text-gradient">{clients.length}</p>
            </div>
            <div className="badge gradient-accent text-white px-4 py-2 text-sm font-medium">
              {filteredClients.length} resultados
            </div>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClients.map((client, index) => (
              <div
                key={client.id_cliente}
                className="card-hover-enhanced bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {client.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{client.nombre}</h3>
                      <p className="text-slate-400 text-sm">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Link 
                      to={`/clients/${client.id_cliente}`}
                      className="btn btn-ghost btn-xs text-slate-300 hover:text-primary-400 hover:bg-primary-500/20 rounded-lg transition-all duration-300"
                      title="Ver Detalles del Cliente"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>
                    <Link 
                      to={`/clients/${client.id_cliente}/history`}
                      className="btn btn-ghost btn-xs text-slate-300 hover:text-info-400 hover:bg-info-500/20 rounded-lg transition-all duration-300"
                      title="Historial de Cotizaciones"
                    >
                      <FiFileText className="w-4 h-4" />
                    </Link>
                    <Link 
                      to={`/clients/${client.id_cliente}/edit`}
                      className="btn btn-ghost btn-xs text-slate-300 hover:text-secondary-400 hover:bg-secondary-500/20 rounded-lg transition-all duration-300"
                      title="Editar Cliente"
                    >
                      <FiEdit className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="space-y-3">
                  {client.telefono && (
                    <div className="flex items-center text-slate-300">
                      <FiPhone className="w-4 h-4 mr-2 text-primary-400" />
                      <span className="text-sm">{client.telefono}</span>
                    </div>
                  )}
                  {client.direccion && (
                    <div className="flex items-center text-slate-300">
                      <FiMapPin className="w-4 h-4 mr-2 text-secondary-400" />
                      <span className="text-sm truncate">{client.direccion}</span>
                    </div>
                  )}
                  <div className="flex items-center text-slate-300">
                    <FiCalendar className="w-4 h-4 mr-2 text-accent-400" />
                    <span className="text-sm">
                      Registrado: {new Date(client.fecha_registro).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700">
                  <Link
                    to={`/clients/${client.id_cliente}`}
                    className="btn btn-modern w-full text-white text-sm py-2"
                  >
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="join">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="join-item btn btn-outline border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`join-item btn ${
                      currentPage === page
                        ? 'gradient-primary text-white'
                        : 'btn-outline border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="join-item btn btn-outline border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 animate-fade-in-up">
          <div className="w-24 h-24 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
            <FiUsers className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No se encontraron clientes</h3>
          <p className="text-slate-400 mb-6">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer cliente'}
          </p>
          {!searchTerm && (
            <Link
              to="/clients/create"
              className="btn btn-modern text-white"
            >
              <FiPlus className="w-5 h-5 mr-2" />
              Crear Primer Cliente
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientsList;
