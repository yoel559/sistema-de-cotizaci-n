import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiTruck, FiClock, FiDownload, FiPrinter, FiFileText, FiDollarSign } from 'react-icons/fi';
import { useQuery } from 'react-query';
import PDFGenerator from '../utils/pdfGenerator';
import { inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';

const QuotationCard = ({ quotation, showActions = true, onAdvanceStage }) => {
  // Debug: Log quotation data
  console.log('QuotationCard received quotation:', quotation);
  console.log('Available IDs:', {
    id: quotation?.id,
    id_cotizacion: quotation?.id_cotizacion,
    id_quotation: quotation?.id_quotation
  });
  
  // Get the ID for navigation - el backend devuelve id_cotizacion
  const quotationId = quotation?.id_cotizacion || quotation?.id || quotation?.id_quotation;
  console.log('Selected ID for navigation:', quotationId);

  // Extraer VIN del string del vehículo
  const vehiculoStr = quotation.vehiculo || '';
  const vinMatch = vehiculoStr.match(/VIN:\s*([^-]+)/);
  const vin = vinMatch ? vinMatch[1].trim() : null;

  // Obtener información del vehículo desde la base de datos si tenemos VIN
  const { data: vehicleData } = useQuery(
    ['vehicle-by-vin', vin],
    () => {
      if (!vin) return null;
      return inventoryAPI.getVehicles({ limit: 1000 }).then(response => {
        const vehicles = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        return vehicles.find(v => v.vin === vin) || null;
      });
    },
    {
      enabled: !!vin,
      staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    }
  );

  const vehicle = vehicleData || null;
  
  // Prevent navigation if no valid ID
  if (!quotationId) {
    console.error('No valid ID found for quotation:', quotation);
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="alert alert-warning">
            <span>Error: Cotización sin ID válido</span>
          </div>
        </div>
      </div>
    );
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'caliente': return 'badge-error';
      case 'tibio': return 'badge-warning';
      case 'frio': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'prospecto': return 'bg-blue-500';
      case 'orden_compra': return 'bg-purple-500';
      case 'contrato': return 'bg-green-500';
      case 'asignacion': return 'bg-orange-500';
      case 'entrega': return 'bg-red-500';
      case 'posventa': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStageLabel = (stage) => {
    const labels = {
      'prospecto': 'Prospecto',
      'orden_compra': 'Orden de Compra',
      'contrato': 'Contrato',
      'asignacion': 'Asignación',
      'entrega': 'Entrega',
      'posventa': 'Posventa'
    };
    return labels[stage] || stage;
  };

  const handleGeneratePDF = async () => {
    try {
      const pdfGenerator = new PDFGenerator();
      
      // Extraer información del vehículo
      const vehiculoStr = quotation.vehiculo || '';
      const marcaModelo = vehiculoStr.split(' - ')[0] || vehiculoStr;
      const vinMatch = vehiculoStr.match(/VIN:\s*([^-]+)/);
      const vin = vinMatch ? vinMatch[1].trim() : null;
      const colorMatch = vehiculoStr.match(/Color:\s*([^-]+)/);
      const color = colorMatch ? colorMatch[1].trim() : null;
      const precioMatch = vehiculoStr.match(/Precio:\s*\$?([\d,]+\.?\d*)/);
      const precio = precioMatch ? precioMatch[1].replace(/,/g, '') : null;
      
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
        number: quotation.numero_cotizacion || `COT-${quotationId}`,
        client: {
          id_cliente: quotation.cliente?.id_cliente || quotation.id_cliente,
          nombre: quotation.cliente?.nombre || 'Cliente',
          apellidos: quotation.cliente?.apellidos || '',
          nit: quotation.cliente?.nit || 'N/A',
          direccion: quotation.cliente?.direccion || 'N/A',
          telefono: quotation.cliente?.telefono || 'N/A',
          email: quotation.cliente?.email || 'N/A'
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

  const handleGeneratePaymentReceipt = () => {
    try {
      const pdfGenerator = new PDFGenerator();
      
      const paymentData = {
        reference: `PAY-${Date.now().toString().slice(-8)}`,
        clientName: quotation.cliente?.nombre || 'Cliente',
        quotationNumber: quotation.numero_cotizacion || `COT-${quotationId}`,
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

  const handlePrintQuotation = async () => {
    try {
      // Extraer información del vehículo
      const vehiculoStr = quotation.vehiculo || '';
      const vinMatch = vehiculoStr.match(/VIN:\s*([^-]+)/);
      const vin = vinMatch ? vinMatch[1].trim() : null;
      const colorMatch = vehiculoStr.match(/Color:\s*([^-]+)/);
      const color = colorMatch ? colorMatch[1].trim() : null;
      const precioMatch = vehiculoStr.match(/Precio:\s*\$?([\d,]+\.?\d*)/);
      const precio = precioMatch ? precioMatch[1].replace(/,/g, '') : null;
      
      // Obtener información completa del vehículo desde la base de datos
      let vehicleMarca = null;
      let vehicleModel = null;
      let vehicleImageUrl = null;
      
      if (vin) {
        try {
          const vehiclesResponse = await inventoryAPI.getVehicles({ limit: 1000 });
          const vehicles = Array.isArray(vehiclesResponse?.data) ? vehiclesResponse.data : (Array.isArray(vehiclesResponse) ? vehiclesResponse : []);
          const vehicle = vehicles.find(v => v.vin === vin);
          if (vehicle) {
            vehicleMarca = vehicle.marca || null;
            vehicleModel = vehicle.model || null;
            if (vehicle.image_url) {
              vehicleImageUrl = vehicle.image_url.startsWith('http') 
                ? vehicle.image_url 
                : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${vehicle.image_url}`;
            }
          }
        } catch (error) {
          console.error('Error obteniendo información del vehículo:', error);
        }
      }
      
      // Si no se encontró el vehículo, intentar extraer del string
      if (!vehicleMarca && !vehicleModel) {
        const marcaModelo = vehiculoStr.split(' - ')[0] || vehiculoStr;
        // Intentar separar marca y modelo si están juntos
        const parts = marcaModelo.split(' ');
        if (parts.length > 1) {
          vehicleMarca = parts[0];
          vehicleModel = parts.slice(1).join(' ');
        } else {
          vehicleModel = marcaModelo;
        }
      }
      
      // Crear una ventana nueva para imprimir
      const printWindow = window.open('', '_blank');
      
      // Generar el contenido HTML para la cotización
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cotización ${quotation.numero_cotizacion}</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
              color: #333;
              background: white;
              font-size: 11px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #2980b9;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }
            .header-logo {
              display: flex;
              align-items: center;
            }
            .header-logo img {
              max-height: 50px;
              max-width: 150px;
              object-fit: contain;
            }
            .header-quotation {
              text-align: right;
            }
            .header-quotation h1 {
              margin: 0;
              font-size: 16px;
              color: #2c3e50;
              font-weight: bold;
            }
            .company-info {
              margin-bottom: 8px;
            }
            .company-info h3 {
              margin: 0 0 2px 0;
              color: #2c3e50;
              font-size: 12px;
            }
            .company-info p {
              margin: 0;
              color: #7f8c8d;
              font-size: 10px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 10px;
            }
            .info-section {
              background: #f8f9fa;
              padding: 8px;
              border-radius: 3px;
              border-left: 3px solid #2980b9;
            }
            .info-section h3 {
              margin: 0 0 6px 0;
              font-size: 11px;
              color: #2c3e50;
              border-bottom: 1px solid #2980b9;
              padding-bottom: 2px;
            }
            .info-section p {
              margin: 3px 0;
              font-size: 10px;
              line-height: 1.3;
            }
            .info-section strong {
              color: #2c3e50;
            }
            .vehicle-section {
              background: #f8f9fa;
              padding: 10px;
              border-radius: 3px;
              border-left: 3px solid #27ae60;
              margin-bottom: 10px;
            }
            .vehicle-section h3 {
              margin: 0 0 8px 0;
              font-size: 12px;
              color: #2c3e50;
              border-bottom: 1px solid #27ae60;
              padding-bottom: 2px;
            }
            .vehicle-content {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              align-items: start;
            }
            .vehicle-details {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .vehicle-detail-item {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
              border-bottom: 1px solid #e0e0e0;
              font-size: 10px;
            }
            .vehicle-detail-item:last-child {
              border-bottom: none;
            }
            .vehicle-detail-label {
              font-weight: bold;
              color: #2c3e50;
            }
            .vehicle-detail-value {
              color: #34495e;
            }
            .vehicle-price {
              color: #27ae60;
              font-weight: bold;
              font-size: 12px;
            }
            .vehicle-image {
              text-align: center;
            }
            .vehicle-image img {
              max-width: 100%;
              max-height: 100px;
              border-radius: 3px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
              font-size: 10px;
            }
            .items-table th {
              background-color: #2980b9;
              color: white;
              padding: 6px;
              text-align: left;
              font-weight: bold;
              font-size: 10px;
            }
            .items-table td {
              border: 1px solid #ddd;
              padding: 5px;
              text-align: left;
              font-size: 10px;
            }
            .items-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .total-section {
              text-align: right;
              margin-top: 8px;
              padding: 8px;
              background: #ecf0f1;
              border-radius: 3px;
            }
            .total-section p {
              margin: 2px 0;
              font-size: 10px;
            }
            .total-amount {
              font-size: 16px;
              font-weight: bold;
              color: #27ae60;
            }
            .footer {
              margin-top: 10px;
              text-align: center;
              font-size: 9px;
              color: #7f8c8d;
              border-top: 1px solid #ecf0f1;
              padding-top: 8px;
            }
            .footer p {
              margin: 2px 0;
            }
            @media print {
              body { 
                margin: 0;
                padding: 8px;
                font-size: 10px;
              }
              .no-print { 
                display: none; 
              }
              @page {
                size: A4;
                margin: 0.8cm;
              }
              .header {
                margin-bottom: 8px;
                padding-bottom: 6px;
              }
              .info-grid {
                gap: 8px;
                margin-bottom: 8px;
              }
              .vehicle-section {
                margin-bottom: 8px;
                padding: 8px;
              }
              .items-table {
                margin-bottom: 8px;
              }
              .footer {
                margin-top: 8px;
                padding-top: 6px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-logo">
              <img src="/trebol-logo.png" alt="Servicios Empresariales y Generales Trébol S.A.C." onerror="this.style.display='none'">
            </div>
            <div class="header-quotation">
              <h1>COTIZACIÓN N: ${(() => {
                if (quotation.numero_cotizacion) {
                  const numMatch = quotation.numero_cotizacion.match(/\d+/);
                  return numMatch ? numMatch[0] : quotation.numero_cotizacion;
                }
                return quotation.id_cotizacion || quotation.id || 'N/A';
              })()}</h1>
            </div>
          </div>
          
          <div class="company-info">
            <h3>Servicios Empresariales y Generales Trébol</h3>
            <p>Financiamiento Automotriz</p>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>Información del Cliente</h3>
              <p><strong>ID:</strong> ${quotation.cliente?.id_cliente ? `#${quotation.cliente.id_cliente}` : 'N/A'}</p>
              <p><strong>Nombre:</strong> ${quotation.cliente ? `${quotation.cliente.nombre || ''}${quotation.cliente.apellidos ? ' ' + quotation.cliente.apellidos : ''}`.trim() : 'No especificado'}</p>
              <p><strong>Teléfono:</strong> ${quotation.cliente?.telefono || 'No especificado'}</p>
              <p><strong>Email:</strong> ${quotation.cliente?.email || 'No especificado'}</p>
            </div>
            
            <div class="info-section">
              <h3>Información de la Cotización</h3>
              <p><strong>Fecha:</strong> ${quotation.fecha_registro ? new Date(quotation.fecha_registro).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString()}</p>
              <p><strong>Etapa:</strong> ${quotation.stage || 'Prospecto'}</p>
              <p><strong>Vendedor:</strong> ${quotation.usuario?.nombre || quotation.vendedor?.nombre || 'No asignado'}</p>
            </div>
          </div>
          
          ${vehicleMarca || vehicleModel || color || precio ? `
          <div class="vehicle-section">
            <h3>Información del Vehículo</h3>
            <div class="vehicle-content">
              <div class="vehicle-details">
                ${vehicleMarca ? `
                <div class="vehicle-detail-item">
                  <span class="vehicle-detail-label">Marca:</span>
                  <span class="vehicle-detail-value">${vehicleMarca}</span>
                </div>
                ` : ''}
                ${vehicleModel ? `
                <div class="vehicle-detail-item">
                  <span class="vehicle-detail-label">Modelo:</span>
                  <span class="vehicle-detail-value">${vehicleModel}</span>
                </div>
                ` : ''}
                ${color ? `
                <div class="vehicle-detail-item">
                  <span class="vehicle-detail-label">Color:</span>
                  <span class="vehicle-detail-value">${color}</span>
                </div>
                ` : ''}
                ${precio ? `
                <div class="vehicle-detail-item">
                  <span class="vehicle-detail-label">Precio:</span>
                  <span class="vehicle-detail-value vehicle-price">$${parseFloat(precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                ` : ''}
              </div>
              ${vehicleImageUrl ? `
              <div class="vehicle-image">
                <img src="${vehicleImageUrl}" alt="${vehicleMarca ? vehicleMarca + ' ' : ''}${vehicleModel || 'Vehículo'}" onerror="this.style.display='none'">
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.items && quotation.items.length > 0 ? quotation.items.map(item => `
                <tr>
                  <td>${item.descripcion || item.nombre || 'Producto/Servicio'}</td>
                  <td>${item.cantidad || 1}</td>
                  <td>$${parseFloat(item.precio_unitario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>$${parseFloat((item.precio_unitario || 0) * (item.cantidad || 1)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('') : (precio ? `
                <tr>
                  <td>${vehicleMarca ? vehicleMarca + ' ' : ''}${vehicleModel || 'Vehículo'}</td>
                  <td>1</td>
                  <td>$${parseFloat(precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>$${parseFloat(precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ` : '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay productos especificados</td></tr>')}
            </tbody>
          </table>
          
          <div class="total-section">
            <p style="margin: 5px 0;"><strong>Subtotal:</strong> $${precio ? parseFloat(precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (quotation.items && quotation.items.length > 0 ? quotation.items.reduce((sum, item) => sum + ((item.precio_unitario || 0) * (item.cantidad || 1)), 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')}</p>
            <p style="margin: 5px 0;"><strong>IGV (18%):</strong> $${precio ? (parseFloat(precio) * 0.18).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (quotation.items && quotation.items.length > 0 ? (quotation.items.reduce((sum, item) => sum + ((item.precio_unitario || 0) * (item.cantidad || 1)), 0) * 0.18).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')}</p>
            <p class="total-amount" style="margin: 10px 0 0 0;">TOTAL: $${precio ? (parseFloat(precio) * 1.18).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (quotation.items && quotation.items.length > 0 ? (quotation.items.reduce((sum, item) => sum + ((item.precio_unitario || 0) * (item.cantidad || 1)), 0) * 1.18).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (quotation.valor_total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</p>
          </div>
          
          <div class="footer">
            <p>Esta cotización es válida por 30 días desde su emisión.</p>
            <p>Servicios Empresariales y Generales Trébol - Financiamiento Automotriz</p>
            <p><strong>NOS UBICAMOS EN:</strong> AV. M N BUTRON NRO. 1916 (FRENTE DE TOYOTA) PUNO - SAN ROMAN - JULIACA</p>
            <p>Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Esperar a que se cargue el contenido y luego imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
      
      toast.success('Abriendo ventana de impresión...');
    } catch (error) {
      console.error('Error al imprimir cotización:', error);
      toast.error('Error al imprimir la cotización');
    }
  };

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
      {/* Card Header with Gradient */}
      <div className={`h-24 bg-gradient-to-r ${getStageColor(quotation.stage)} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-2 right-2">
          <div className={`badge ${getStatusColor(quotation.estado)} text-white`}>
            {quotation.estado}
          </div>
        </div>
        <div className="absolute bottom-2 left-2 text-white">
          <h3 className="font-bold text-lg">{quotation.numero_cotizacion}</h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body p-4">
        <div className="space-y-2">
          {/* Extraer toda la información del vehículo */}
          {(() => {
            // Extraer color (buscar "Color: ")
            const colorMatch = vehiculoStr.match(/Color:\s*([^-]+)/);
            const color = colorMatch ? colorMatch[1].trim() : null;
            // Extraer precio (buscar "Precio: $")
            const precioMatch = vehiculoStr.match(/Precio:\s*\$?([\d,]+\.?\d*)/);
            const precio = precioMatch ? precioMatch[1].replace(/,/g, '') : null;
            
            // Obtener marca y modelo desde el vehículo de la base de datos o del string
            let vehicleMarca = vehicle?.marca || null;
            let vehicleModel = vehicle?.model || null;
            
            // Si no se encontró en la base de datos, intentar extraer del string
            if (!vehicleMarca && !vehicleModel) {
              const marcaModelo = vehiculoStr.split(' - ')[0] || vehiculoStr;
              const parts = marcaModelo.split(' ');
              if (parts.length > 1) {
                vehicleMarca = parts[0];
                vehicleModel = parts.slice(1).join(' ');
              } else {
                vehicleModel = marcaModelo;
              }
            }
            
            return (
              <>
                {vehicleMarca && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiTruck className="w-4 h-4 text-primary" />
                    <span className="text-base-content/70">Marca:</span>
                    <span className="font-semibold text-base-content">{vehicleMarca}</span>
                  </div>
                )}
                {vehicleModel && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiTruck className="w-4 h-4 text-primary" />
                    <span className="text-base-content/70">Modelo:</span>
                    <span className="font-semibold text-base-content">{vehicleModel}</span>
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
          
          <div className="flex items-center gap-2 text-sm text-base-content/70">
            <FiCalendar className="w-4 h-4" />
            <span>{new Date(quotation.fecha_registro).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-base-content/70">
            <FiClock className="w-4 h-4" />
            <span>Seguimiento: {new Date(quotation.fecha_seguimiento).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Stage Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-base-content/60 mb-1">
            <span>Etapa</span>
            <span>{getStageLabel(quotation.stage)}</span>
          </div>
          <progress 
            className="progress progress-primary w-full" 
            value={quotation.stage === 'prospecto' ? 20 : quotation.stage === 'orden_compra' ? 40 : quotation.stage === 'contrato' ? 60 : quotation.stage === 'asignacion' ? 80 : quotation.stage === 'entrega' ? 90 : 100} 
            max="100"
          ></progress>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="card-actions justify-between mt-4">
            <div className="flex gap-2">
              <button
                onClick={handleGeneratePDF}
                className="btn btn-sm btn-outline btn-primary"
                title="Descargar PDF"
              >
                <FiDownload className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrintQuotation}
                className="btn btn-sm btn-outline btn-info"
                title="Imprimir Cotización"
              >
                <FiFileText className="w-4 h-4" />
              </button>
              <button
                onClick={handleGeneratePaymentReceipt}
                className="btn btn-sm btn-outline btn-success"
                title="Comprobante de Pago"
              >
                <FiPrinter className="w-4 h-4" />
              </button>
            </div>
            <Link 
              to={`/quotations/${quotationId}`} 
              className="btn btn-primary btn-sm"
            >
              Ver Detalles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationCard;
