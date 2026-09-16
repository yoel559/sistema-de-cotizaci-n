import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiEdit,
  FiFileText,
} from 'react-icons/fi';
import { clientsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const { data: clientData, isLoading, error } = useQuery(
    ['client-detail', clientId],
    () => clientsAPI.getById(clientId),
    {
      enabled: !!clientId,
    }
  );

  const client = clientData?.data || clientData; // compatibilidad por si la API envía {data: {...}}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="alert alert-error">
        <FiUser className="w-5 h-5" />
        <span>Error al cargar el cliente</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Detalle del Cliente</h1>
            <p className="text-slate-400 mt-1">
              Información completa del cliente y accesos rápidos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/clients/${client.id_cliente || client.id}/history`}
            className="btn btn-ghost btn-sm"
          >
            <FiFileText className="w-4 h-4 mr-1" />
            Historial
          </Link>
          <Link
            to={`/clients/${client.id_cliente || client.id}/edit`}
            className="btn btn-primary btn-sm"
          >
            <FiEdit className="w-4 h-4 mr-1" />
            Editar
          </Link>
        </div>
      </div>

      {/* Card principal */}
      <div className="glass-effect rounded-xl p-6 border-gradient card-hover-enhanced">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">
                {(client.nombre || client.full_name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {client.nombre} {client.apellidos}
              </h2>
              {client.email && (
                <p className="text-slate-400 text-sm">{client.email}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-accent-400" />
              <span>
                Registrado:{' '}
                {client.fecha_registro
                  ? new Date(client.fecha_registro).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.telefono && (
            <div className="flex items-center text-slate-300">
              <FiPhone className="w-4 h-4 mr-2 text-primary-400" />
              <span>{client.telefono}</span>
            </div>
          )}
          {client.direccion && (
            <div className="flex items-center text-slate-300">
              <FiMapPin className="w-4 h-4 mr-2 text-secondary-400" />
              <span className="truncate">{client.direccion}</span>
            </div>
          )}
        </div>

        {client.preferencias && (
          <div className="mt-6 pt-4 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">
              Preferencias
            </h3>
            <p className="text-slate-400 text-sm whitespace-pre-line">
              {client.preferencias}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetail;

