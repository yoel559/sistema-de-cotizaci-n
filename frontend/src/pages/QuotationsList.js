import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  FiFileText,
  FiPlus,
  FiSearch,
  FiEdit,
  FiEye,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiPrinter,
  FiUser,
  FiDollarSign,
  FiTruck
} from 'react-icons/fi';
import { quotationsAPI, inventoryAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PDFGenerator from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

const QuotationsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data: quotations, isLoading, error } = useQuery(
    ['quotations', currentPage, searchTerm],
    () => quotationsAPI.getAll({ page: currentPage, limit: itemsPerPage, search: searchTerm }),
    {
      keepPreviousData: true,
    }
  );

  const handleGeneratePDF = async (quotation) => {
    try {
      const pdfGenerator = new PDFGenerator();
      
      // Extraer información del vehículo
      const vehiculoStr = quotation.vehiculo || '';
      
      // Extraer VIN del string del vehículo
      const vinMatch = vehiculoStr.match(/VIN:\s*([^-]+)/);
      const vin = vinMatch ? vinMatch[1].trim() : null;
      
      // Obtener URL de la imagen del vehículo si está disponible
      let vehicleImageUrl = null;
      // Intentar obtener el vehículo por VIN
      if (vin) {
        try {
          // Buscar vehículo por VIN en la lista de vehículos
          const vehiclesResponse = await inventoryAPI.getVehicles({ limit: 1000 });
          const vehicles = Array.isArray(vehiclesResponse?.data) ? vehiclesResponse.data : (Array.isArray(vehiclesResponse) ? vehiclesResponse : []);
          const vehicle = vehicles.find(v => v.vin === vin);
          if (vehicle && vehicle.image_url) {
            vehicleImageUrl = vehicle.image_url.startsWith('http') 
              ? vehicle.image_url 
              : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${vehicle.image_url}`;
          }
        } catch (error) {
          console.error('Error obteniendo imagen del vehículo:', error);
        }
      }
      
      // Preparar datos para el PDF
      const pdfData = {
        number: quotation.numero_cotizacion || `COT-${quotation.id || quotation.id_cotizacion}`,
        client: {
          id_cliente: quotation.cliente?.id_cliente || quotation.id_cliente,
          nombre: quotation.cliente?.nombre || 'Cliente',
          apellidos: quotation.cliente?.apellidos || '',
          telefono: quotation.cliente?.telefono || 'N/A',
          email: quotation.cliente?.email || 'N/A',
          preferencias: quotation.cliente?.preferencias || 'N/A'
        },
        vehiculo: vehiculoStr,
        vehicleImageUrl: vehicleImageUrl,
        salesperson: quotation.usuario?.nombre || 'Vendedor',
        paymentType: quotation.tipo_pago || 'Crédito [ ] Contado [X]',
        items: quotation.items?.map(item => ({
          cantidad: item.cantidad || 1,
          descripcion: item.descripcion || 'Producto/Servicio',
          precio_unitario: item.precio_unitario || 0,
          valor_exento: item.valor_exento || 0,
          valor_afecto: item.precio_unitario || 0
        })) || []
      };

      const pdf = await pdfGenerator.generateQuotationPDF(pdfData);
      
      // Descargar el PDF
      const fileName = `Cotizacion_${pdfData.number}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const handleGeneratePaymentReceipt = (quotation) => {
    try {
      const pdfGenerator = new PDFGenerator();
      
      const paymentData = {
        reference: `PAY-${Date.now().toString().slice(-8)}`,
        clientName: quotation.cliente ? `${quotation.cliente.nombre}${quotation.cliente.apellidos ? ' ' + quotation.cliente.apellidos : ''}`.trim() : 'Cliente',
        quotationNumber: quotation.numero_cotizacion || `COT-${quotation.id}`,
        amount: quotation.valor_total || 0
      };

      const pdf = pdfGenerator.generatePaymentReceipt(paymentData);
      
      const fileName = `Comprobante_Pago_${paymentData.reference}.pdf`;
      pdf.save(fileName);
      
      toast.success('Comprobante de pago generado');
    } catch (error) {
      console.error('Error generando comprobante:', error);
      toast.error('Error al generar el comprobante');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error cargando cotizaciones</div>;

  const quotationsList = quotations?.data || [];
  const totalPages = Math.ceil((quotations?.total || 0) / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Cotizaciones</h1>
          <p className="text-base-content/60 mt-1">
            Gestiona todas las cotizaciones del sistema
          </p>
        </div>
        <Link to="/quotations/create" className="btn btn-primary">
          <FiPlus className="w-4 h-4 mr-2" />
          Nueva Cotización
        </Link>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="form-control flex-1">
              <div className="input-group">
                <span className="bg-base-200">
                  <FiSearch className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar cotizaciones..."
                  className="input input-bordered flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline">
                <FiCalendar className="w-4 h-4 mr-2" />
                Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="text-sm text-base-content/60 mb-4">
        {quotationsList.length} resultados encontrados
      </div>

      {/* Quotations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotationsList.map((quotation, index) => (
          <div key={`quotation-${quotation.id || quotation.id_cotizacion || index}`} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="card-title text-lg">
                    {quotation.numero_cotizacion || `COT-${quotation.id}`}
                  </h3>
                  <p className="text-sm text-base-content/60">
                    {quotation.cliente ? `${quotation.cliente.nombre}${quotation.cliente.apellidos ? ' ' + quotation.cliente.apellidos : ''}`.trim() : 'Cliente'}
                  </p>
                </div>
                <div className="badge badge-primary">
                  {quotation.estado || 'Activa'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {/* Extraer toda la información del vehículo */}
                {(() => {
                  const vehiculoStr = quotation.vehiculo || '';
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
                    <>
                      {marcaModelo && (
                        <div className="flex items-center gap-2 text-sm">
                          <FiTruck className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-base-content">{marcaModelo}</span>
                        </div>
                      )}
                      {vin && (
                        <div className="flex items-center gap-2 text-sm text-base-content/70">
                          <span className="text-xs">VIN:</span>
                          <span>{vin}</span>
                        </div>
                      )}
                      {color && (
                        <div className="flex items-center gap-2 text-sm text-base-content/70">
                          <span className="text-xs">Color:</span>
                          <span>{color}</span>
                        </div>
                      )}
                      {precio && (
                        <div className="flex items-center gap-2 text-sm">
                          <FiDollarSign className="w-4 h-4 text-success" />
                          <span className="font-bold text-success">
                            ${parseFloat(precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
                
                <div className="flex items-center gap-2 text-sm">
                  <FiCalendar className="w-4 h-4 text-base-content/60" />
                  <span>{new Date(quotation.fecha_creacion || quotation.fecha_registro).toLocaleDateString('es-CO')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FiUser className="w-4 h-4 text-base-content/60" />
                  <span>{quotation.usuario?.nombre || 'Vendedor'}</span>
                </div>
              </div>

              <div className="card-actions justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGeneratePDF(quotation)}
                    className="btn btn-sm btn-outline btn-primary"
                    title="Generar PDF"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleGeneratePaymentReceipt(quotation)}
                    className="btn btn-sm btn-outline btn-success"
                    title="Comprobante de Pago"
                  >
                    <FiPrinter className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/quotations/${quotation.id_cotizacion || quotation.id}`}
                    className="btn btn-sm btn-ghost"
                  >
                    <FiEye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/quotations/${quotation.id_cotizacion || quotation.id}/edit`}
                    className="btn btn-sm btn-ghost"
                  >
                    <FiEdit className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn btn-sm btn-outline"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm text-base-content/60">
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn btn-sm btn-outline"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {quotationsList.length === 0 && (
        <div className="text-center py-12">
          <FiFileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-base-content/60 mb-2">
            No hay cotizaciones
          </h3>
          <p className="text-base-content/40 mb-6">
            Comienza creando tu primera cotización
          </p>
          <Link to="/quotations/create" className="btn btn-primary">
            <FiPlus className="w-4 h-4 mr-2" />
            Crear Cotización
          </Link>
        </div>
      )}
    </div>
  );
};

export default QuotationsList;