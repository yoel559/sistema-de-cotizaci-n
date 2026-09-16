import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiDollarSign,
  FiCreditCard,
  FiPackage,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiDownload,
  FiPlus,
  FiChevronRight,
  FiTruck
} from 'react-icons/fi';
import { quotationsAPI, documentsAPI, creditAPI, paymentsAPI, inventoryAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';

const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Validar que el ID sea válido (número o string numérico)
  // useParams siempre devuelve strings, así que solo verificamos string numérico
  const isValidId = id && typeof id === 'string' && !isNaN(parseInt(id)) && parseInt(id) > 0;
  const quotationId = isValidId ? parseInt(id) : null;

  // Fetch quotation details
  const { data: quotationResponse, isLoading, error } = useQuery(
    ['quotation', quotationId],
    () => quotationsAPI.getById(quotationId),
    {
      enabled: isValidId && !!quotationId,
      select: (response) => {
        // React Query automáticamente extrae response.data, pero verificamos por si acaso
        const data = response?.data || response;
        console.log('Cotización cargada (raw):', response);
        console.log('Cotización cargada (processed):', data);
        console.log('Cliente:', data?.cliente);
        console.log('Usuario:', data?.usuario);
        return data;
      },
      onSuccess: (data) => {
        console.log('Cotización cargada exitosamente:', data);
        console.log('Cliente:', data?.cliente);
        console.log('Usuario:', data?.usuario);
      },
      onError: (err) => {
        console.error('Error cargando cotización:', err);
        console.error('Error response:', err.response);
      }
    }
  );

  // Extraer datos de la respuesta
  const quotation = quotationResponse;
  
  // Debug: Log quotation data
  useEffect(() => {
    if (quotation) {
      console.log('Quotation data:', quotation);
      console.log('Quotation cliente:', quotation.cliente);
      console.log('Quotation cliente nombre:', quotation.cliente?.nombre);
      console.log('Quotation vehiculo:', quotation.vehiculo);
      console.log('Quotation fecha_registro:', quotation.fecha_registro);
    }
  }, [quotation]);

  // Fetch related data
  const { data: documents } = useQuery(
    ['quotation-documents', quotationId],
    () => documentsAPI.getByQuotation(quotationId),
    { enabled: isValidId && !!quotationId }
  );

  const { data: creditInfo } = useQuery(
    ['quotation-credit', quotationId],
    () => creditAPI.getByQuotation(quotationId),
    { enabled: isValidId && !!quotationId }
  );

  const { data: paymentSchedule } = useQuery(
    ['quotation-payments', quotationId],
    () => paymentsAPI.getScheduleByQuotation(quotationId),
    { enabled: isValidId && !!quotationId }
  );

  const { data: inventoryInfo } = useQuery(
    ['quotation-inventory', quotationId],
    () => inventoryAPI.getByQuotation(quotationId),
    { enabled: isValidId && !!quotationId }
  );

  const { data: statusHistory } = useQuery(
    ['quotation-status-history', quotationId],
    () => quotationsAPI.getStatusHistory(quotationId),
    { enabled: isValidId && !!quotationId }
  );

  const { data: stageHistory } = useQuery(
    ['quotation-stage-history', quotationId],
    () => quotationsAPI.getStageHistory(quotationId),
    { enabled: isValidId && !!quotationId }
  );

  const handleAdvanceStage = async (newStage) => {
    if (!quotationId) return;
    try {
      await quotationsAPI.advanceStage(quotationId, newStage);
      window.location.reload();
    } catch (error) {
      console.error('Error advancing stage:', error);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      prospecto: 'badge-info',
      orden_compra: 'badge-warning',
      contrato: 'badge-primary',
      asignacion: 'badge-secondary',
      entrega: 'badge-success',
      posventa: 'badge-accent'
    };
    return colors[stage] || 'badge-neutral';
  };

  const getStatusColor = (status) => {
    const colors = {
      caliente: 'badge-error',
      tibio: 'badge-warning',
      frio: 'badge-info'
    };
    return colors[status] || 'badge-neutral';
  };

  if (!isValidId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl max-w-md w-full mx-4">
          <div className="card-body text-center">
            <div className="text-error text-6xl mb-4">
              <FiAlertTriangle className="mx-auto" />
            </div>
            <h2 className="card-title justify-center text-xl mb-4">ID de cotización inválido</h2>
            <p className="text-base-content/60 mb-6">
              {id ? (
                <>El ID "{id}" no es válido. Por favor, verifica que estés accediendo a una cotización existente.</>
              ) : (
                <>No se proporcionó un ID de cotización. Por favor, selecciona una cotización desde la lista.</>
              )}
            </p>
            <div className="card-actions justify-center">
              <button 
                onClick={() => navigate('/quotations')}
                className="btn btn-primary"
              >
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Volver a Cotizaciones
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn btn-outline"
              >
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Ir al Dashboard
              </button>
            </div>
          </div>
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

  if (error || !quotation) {
    return (
      <div className="alert alert-error">
        <FiAlertTriangle className="w-5 h-5" />
        <span>Error al cargar la cotización</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <h1 className="text-3xl font-bold text-base-content">
              {quotation.numero_cotizacion}
            </h1>
            <p className="text-base-content/60 mt-1">
              Detalle de Cotización
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/quotations/${quotationId}/edit`} className="btn btn-outline">
            <FiEdit className="w-4 h-4 mr-2" />
            Editar
          </Link>
          <button className="btn btn-error btn-outline">
            <FiTrash2 className="w-4 h-4 mr-2" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Status and Stage */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Estado:</span>
              <span className={`badge ${getStatusColor(quotation.estado)}`}>
                {quotation.estado}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Etapa:</span>
              <span className={`badge ${getStageColor(quotation.stage)}`}>
                {quotation.stage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Monto:</span>
              <span className="font-semibold text-lg">
                {formatCurrency(quotation.monto_total)}
              </span>
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
          className={`tab ${activeTab === 'documents' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FiFileText className="w-4 h-4 mr-2" />
          Documentos
        </button>
        <button
          className={`tab ${activeTab === 'credit' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('credit')}
        >
          <FiCreditCard className="w-4 h-4 mr-2" />
          Crédito
        </button>
        <button
          className={`tab ${activeTab === 'payments' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <FiDollarSign className="w-4 h-4 mr-2" />
          Pagos
        </button>
        <button
          className={`tab ${activeTab === 'inventory' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <FiPackage className="w-4 h-4 mr-2" />
          Inventario
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FiClock className="w-4 h-4 mr-2" />
          Historial
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Información Básica</h3>
              <div className="space-y-4">
                {/* Número de Cotización */}
                <div className="flex justify-between">
                  <span className="text-sm text-base-content/60">Número de Cotización:</span>
                  <span className="font-medium">{quotation?.numero_cotizacion || 'N/A'}</span>
                </div>

                {/* Información del Cliente */}
                <div className="divider my-2"></div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-base-content">Información del Cliente</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-base-content/60">ID:</span>
                    <span className="font-medium">
                      {quotation?.cliente?.id_cliente 
                        ? `#${quotation.cliente.id_cliente}` 
                        : quotation?.id_cliente 
                        ? `#${quotation.id_cliente}` 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-base-content/60">Cliente:</span>
                    <span className="font-semibold text-base-content">
                      {quotation?.cliente 
                        ? `${quotation.cliente.nombre || ''}${quotation.cliente.apellidos ? ' ' + quotation.cliente.apellidos : ''}`.trim() || 'N/A'
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                
                {/* Información detallada del vehículo */}
                <div className="divider my-2"></div>
                {(() => {
                  const vehiculoStr = quotation?.vehiculo || '';
                  if (!vehiculoStr) {
                    return (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base-content flex items-center gap-2">
                          <FiTruck className="w-4 h-4 text-primary" />
                          Información del Vehículo
                        </h4>
                        <div className="text-sm text-base-content/60">No hay información del vehículo disponible</div>
                      </div>
                    );
                  }
                  
                  // Extraer marca/modelo (antes del primer " - ")
                  const marcaModelo = vehiculoStr.split(' - ')[0] || vehiculoStr;
                  // Extraer VIN (buscar "VIN: ")
                  const vinMatch = vehiculoStr.match(/VIN:\s*([^-]+)/);
                  const vin = vinMatch ? vinMatch[1].trim() : null;
                  // Extraer color (buscar "Color: ")
                  const colorMatch = vehiculoStr.match(/Color:\s*([^-]+)/);
                  const color = colorMatch ? colorMatch[1].trim() : null;
                  // Extraer precio (buscar "Precio: $")
                  const precioMatch = vehiculoStr.match(/Precio:\s*\$?([\d,]+\.?\d*)/);
                  const precio = precioMatch ? precioMatch[1].replace(/,/g, '') : null;
                  
                  return (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-base-content flex items-center gap-2">
                        <FiTruck className="w-4 h-4 text-primary" />
                        Información del Vehículo
                      </h4>
                      {marcaModelo && marcaModelo !== vehiculoStr && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/60">Marca/Modelo:</span>
                          <span className="font-semibold text-base-content">{marcaModelo}</span>
                        </div>
                      )}
                      {vin && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/60">VIN:</span>
                          <span className="font-medium">{vin}</span>
                        </div>
                      )}
                      {color && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/60">Color:</span>
                          <span className="font-medium">{color}</span>
                        </div>
                      )}
                      {precio && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/60 flex items-center gap-1">
                            <FiDollarSign className="w-3 h-3" />
                            Precio del Vehículo:
                          </span>
                          <span className="font-bold text-success text-lg">
                            ${parseFloat(precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {(!marcaModelo || marcaModelo === vehiculoStr) && !vin && !color && !precio && vehiculoStr && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-base-content/60">Vehículo:</span>
                          <span className="font-medium">{vehiculoStr}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {/* Fecha */}
                <div className="divider my-2"></div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-base-content">Fechas</h4>
                  <div className="flex justify-between">
                    <span className="text-sm text-base-content/60">Fecha de Registro:</span>
                    <span className="font-medium">
                      {quotation?.fecha_registro 
                        ? (() => {
                            try {
                              const date = new Date(quotation.fecha_registro);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                });
                              }
                            } catch (e) {
                              console.error('Error parsing fecha_registro:', e);
                            }
                            return 'N/A';
                          })()
                        : 'N/A'}
                    </span>
                  </div>
                  {quotation?.fecha_seguimiento && (
                    <div className="flex justify-between">
                      <span className="text-sm text-base-content/60">Fecha de Seguimiento:</span>
                      <span className="font-medium">
                        {(() => {
                          try {
                            const date = new Date(quotation.fecha_seguimiento);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            }
                          } catch (e) {
                            console.error('Error parsing fecha_seguimiento:', e);
                          }
                          return 'N/A';
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stage Actions */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Acciones de Etapa</h3>
              <div className="space-y-2">
                {quotation.stage === 'prospecto' && (
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => handleAdvanceStage('orden_compra')}
                  >
                    <FiChevronRight className="w-4 h-4 mr-2" />
                    Avanzar a Orden de Compra
                  </button>
                )}
                {quotation.stage === 'orden_compra' && (
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => handleAdvanceStage('contrato')}
                  >
                    <FiChevronRight className="w-4 h-4 mr-2" />
                    Avanzar a Contrato
                  </button>
                )}
                {quotation.stage === 'contrato' && (
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => handleAdvanceStage('asignacion')}
                  >
                    <FiChevronRight className="w-4 h-4 mr-2" />
                    Avanzar a Asignación
                  </button>
                )}
                {quotation.stage === 'asignacion' && (
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => handleAdvanceStage('entrega')}
                  >
                    <FiChevronRight className="w-4 h-4 mr-2" />
                    Avanzar a Entrega
                  </button>
                )}
                {quotation.stage === 'entrega' && (
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => handleAdvanceStage('posventa')}
                  >
                    <FiChevronRight className="w-4 h-4 mr-2" />
                    Avanzar a Posventa
                  </button>
                )}
                {quotation.stage === 'posventa' && (
                  <div className="text-center text-base-content/60">
                    <FiCheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>Proceso completado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Documentos</h3>
              <button className="btn btn-primary btn-sm">
                <FiPlus className="w-4 h-4 mr-2" />
                Subir Documento
              </button>
            </div>
            {documents && documents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Archivo</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.document_type?.name}</td>
                        <td>{doc.filename}</td>
                        <td>
                          <span className={`badge ${
                            doc.status === 'revisado' ? 'badge-success' :
                            doc.status === 'pendiente' ? 'badge-warning' : 'badge-error'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-xs">
                              <FiEye className="w-3 h-3" />
                            </button>
                            <button className="btn btn-ghost btn-xs">
                              <FiDownload className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FiFileText className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
                <p className="text-base-content/60">No hay documentos subidos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credit Tab */}
      {activeTab === 'credit' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Información de Crédito</h3>
            {creditInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="stat bg-primary/10 rounded-lg p-4">
                    <div className="stat-title">Solicitudes</div>
                    <div className="stat-value text-primary">{creditInfo.applications?.length || 0}</div>
                  </div>
                  <div className="stat bg-success/10 rounded-lg p-4">
                    <div className="stat-title">Aprobadas</div>
                    <div className="stat-value text-success">
                      {Array.isArray(creditInfo.applications) ? creditInfo.applications.filter(app => app.status === 'aprobado').length : 0}
                    </div>
                  </div>
                </div>
                {/* Credit details would go here */}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiCreditCard className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
                <p className="text-base-content/60">No hay información de crédito</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Cronograma de Pagos</h3>
            {paymentSchedule ? (
              <div className="space-y-4">
                {/* Payment schedule details would go here */}
                <div className="text-center py-8">
                  <FiDollarSign className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
                  <p className="text-base-content/60">Cronograma de pagos disponible</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FiDollarSign className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
                <p className="text-base-content/60">No hay cronograma de pagos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Inventario y Entrega</h3>
            {inventoryInfo ? (
              <div className="space-y-4">
                {/* Inventory details would go here */}
                <div className="text-center py-8">
                  <FiPackage className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
                  <p className="text-base-content/60">Información de inventario disponible</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FiPackage className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
                <p className="text-base-content/60">No hay información de inventario</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Status History */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Historial de Estados</h3>
              {statusHistory && statusHistory.length > 0 ? (
                <div className="space-y-3">
                  {statusHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                      <div>
                        <span className="badge badge-outline mr-2">{entry.old_status}</span>
                        <FiChevronRight className="w-4 h-4 inline mx-2" />
                        <span className="badge badge-outline">{entry.new_status}</span>
                      </div>
                      <div className="text-sm text-base-content/60">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiClock className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
                  <p className="text-base-content/60">No hay historial de estados</p>
                </div>
              )}
            </div>
          </div>

          {/* Stage History */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Historial de Etapas</h3>
              {stageHistory && stageHistory.length > 0 ? (
                <div className="space-y-3">
                  {stageHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                      <div>
                        <span className="badge badge-outline mr-2">{entry.old_stage}</span>
                        <FiChevronRight className="w-4 h-4 inline mx-2" />
                        <span className="badge badge-outline">{entry.new_stage}</span>
                        {entry.note && (
                          <p className="text-sm text-base-content/60 mt-1">{entry.note}</p>
                        )}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiClock className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
                  <p className="text-base-content/60">No hay historial de etapas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationDetail;
