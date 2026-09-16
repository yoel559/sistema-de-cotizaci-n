import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  FiArrowLeft,
  FiFileText,
  FiCalendar,
  FiDollarSign,
  FiBarChart2,
  FiClock,
  FiEye,
  FiDownload
} from 'react-icons/fi';
import { quotationsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PDFGenerator from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

const ClientQuotationHistory = () => {
  const { clientId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: history, isLoading, error } = useQuery(
    ['client-quotation-history', clientId],
    () => quotationsAPI.getClientHistory(clientId),
    {
      enabled: !!clientId,
    }
  );

  const handleGeneratePDF = (quotation) => {
    try {
      const pdfGenerator = new PDFGenerator();
      
      const pdfData = {
        number: quotation.numero_cotizacion || `COT-${quotation.id}`,
        client: {
          nombre: history?.client_name || 'Cliente',
          nit: history?.client_nit || 'N/A',
          direccion: history?.client_address || 'N/A',
          telefono: history?.client_phone || 'N/A',
          email: history?.client_email || 'N/A'
        },
        salesperson: quotation.usuario?.nombre || 'Vendedor',
        paymentType: quotation.tipo_pago || 'Crédito [ ] Contado [X]',
        items: [{
          cantidad: 1,
          descripcion: quotation.vehiculo || 'Producto/Servicio',
          precio_unitario: quotation.valor_total || 0,
          valor_exento: 0,
          valor_afecto: quotation.valor_total || 0
        }]
      };

      const pdf = pdfGenerator.generateQuotationPDF(pdfData);
      const fileName = `Cotizacion_${pdfData.number}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error cargando historial del cliente</div>;
  if (!history) return <div className="text-gray-500">No se encontró historial</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/clients"
            className="btn btn-ghost btn-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-base-content">
              Historial de Cotizaciones
            </h1>
            <p className="text-base-content/60 mt-1">
              Cliente ID: {clientId}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{history.total_quotations}</div>
                <div className="text-sm text-base-content/60">Total Cotizaciones</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  ${history.total_amount?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-base-content/60">Valor Total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center">
                <FiClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {history.last_activity ? new Date(history.last_activity).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-sm text-base-content/60">Última Actividad</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-info rounded-lg flex items-center justify-center">
                <FiBarChart2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Object.keys(history.status_counts || {}).length}
                </div>
                <div className="text-sm text-base-content/60">Estados Diferentes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed">
        <button
          className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiEye className="w-4 h-4 mr-2" />
          Resumen
        </button>
        <button
          className={`tab ${activeTab === 'quotations' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('quotations')}
        >
          <FiFileText className="w-4 h-4 mr-2" />
          Cotizaciones
        </button>
        <button
          className={`tab ${activeTab === 'yearly' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('yearly')}
        >
          <FiCalendar className="w-4 h-4 mr-2" />
          Por Año
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Distribución por Estado</h3>
              <div className="space-y-3">
                {Object.entries(history.status_counts || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-base-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(count / history.total_quotations) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stage Distribution */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Distribución por Etapa</h3>
              <div className="space-y-3">
                {Object.entries(history.stage_counts || {}).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between">
                    <span className="capitalize">{stage}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-base-200 rounded-full h-2">
                        <div 
                          className="bg-secondary h-2 rounded-full" 
                          style={{ width: `${(count / history.total_quotations) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quotations' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Todas las Cotizaciones</h3>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Fecha</th>
                    <th>Vehículo</th>
                    <th>Valor</th>
                    <th>Estado</th>
                    <th>Etapa</th>
                    <th>Vendedor</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {history.quotations?.map((quotation) => (
                    <tr key={quotation.id}>
                      <td className="font-mono">{quotation.numero_cotizacion}</td>
                      <td>{new Date(quotation.fecha_creacion).toLocaleDateString()}</td>
                      <td>{quotation.vehiculo}</td>
                      <td>${quotation.valor_total?.toLocaleString() || '0'}</td>
                      <td>
                        <span className={`badge ${
                          quotation.estado === 'caliente' ? 'badge-error' :
                          quotation.estado === 'tibio' ? 'badge-warning' :
                          quotation.estado === 'frio' ? 'badge-info' : 'badge-neutral'
                        }`}>
                          {quotation.estado}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline">{quotation.stage}</span>
                      </td>
                      <td>{quotation.usuario?.nombre || 'N/A'}</td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            to={`/quotations/${quotation.id}`}
                            className="btn btn-ghost btn-xs"
                          >
                            <FiEye className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleGeneratePDF(quotation)}
                            className="btn btn-ghost btn-xs"
                          >
                            <FiDownload className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'yearly' && (
        <div className="space-y-6">
          {Object.entries(history.yearly_stats || {}).map(([year, stats]) => (
            <div key={year} className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title">Año {year}</h3>
                  <div className="stats stats-horizontal">
                    <div className="stat">
                      <div className="stat-title">Cotizaciones</div>
                      <div className="stat-value text-primary">{stats.count}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Valor Total</div>
                      <div className="stat-value text-success">${stats.amount?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.quotations?.map((quotation) => (
                    <div key={quotation.id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <h4 className="font-semibold">{quotation.numero_cotizacion}</h4>
                        <p className="text-sm text-base-content/60">
                          {new Date(quotation.fecha_creacion).toLocaleDateString()}
                        </p>
                        <p className="text-sm">${quotation.valor_total?.toLocaleString()}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`badge badge-sm ${
                            quotation.estado === 'caliente' ? 'badge-error' :
                            quotation.estado === 'tibio' ? 'badge-warning' :
                            quotation.estado === 'frio' ? 'badge-info' : 'badge-neutral'
                          }`}>
                            {quotation.estado}
                          </span>
                          <span className="badge badge-sm badge-outline">{quotation.stage}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientQuotationHistory;
