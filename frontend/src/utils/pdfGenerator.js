import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

class PDFGenerator {
  constructor() {
    this.doc = new jsPDF();
    // Configuración de colores
    this.primaryColor = [41, 128, 185]; // Azul
    this.secondaryColor = [52, 73, 94]; // Gris oscuro
    this.accentColor = [46, 204, 113]; // Verde
  }

  async generateQuotationPDF(quotationData) {
    const doc = new jsPDF();

    // Diseño profesional de cotización como el modelo
    await this.addHeader(doc, quotationData);
    await this.addClientInfo(doc, quotationData);
    await this.addVehicleInfo(doc, quotationData);
    await this.addItemsTable(doc, quotationData);
    await this.addTotals(doc, quotationData);
    await this.addFooter(doc, quotationData);

    return doc;
  }

  // Extraer información del vehículo del string
  extractVehicleInfo(vehiculoStr) {
    if (!vehiculoStr) return null;
    
    const marcaModelo = vehiculoStr.split(' - ')[0] || vehiculoStr;
    const vinMatch = vehiculoStr.match(/VIN:\s*([^-]+)/);
    const vin = vinMatch ? vinMatch[1].trim() : null;
    const colorMatch = vehiculoStr.match(/Color:\s*([^-]+)/);
    const color = colorMatch ? colorMatch[1].trim() : null;
    const precioMatch = vehiculoStr.match(/Precio:\s*\$?([\d,]+\.?\d*)/);
    const precio = precioMatch ? precioMatch[1].replace(/,/g, '') : null;
    
    return {
      marcaModelo,
      vin,
      color,
      precio: precio ? parseFloat(precio) : null
    };
  }

  // Agregar información del vehículo con imagen
  async addVehicleInfo(doc, data) {
    const yStart = 95;
    const darkBlue = [25, 42, 86];
    const darkGray = [44, 62, 80];
    const accentBlue = [41, 128, 185];
    
    // Extraer información del vehículo
    const vehiculoStr = data.vehiculo || data.items?.[0]?.descripcion || '';
    const vehicleInfo = this.extractVehicleInfo(vehiculoStr);
    
    if (!vehicleInfo) {
      doc.lastVehicleY = yStart;
      return;
    }
    
    // Título de la sección
    doc.setFontSize(13);
    doc.setTextColor(...darkBlue);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL VEHÍCULO', 20, yStart);
    
    // Línea decorativa
    doc.setDrawColor(...accentBlue);
    doc.setLineWidth(1.5);
    doc.line(20, yStart + 2, 120, yStart + 2);
    
    let currentY = yStart + 12;
    let imageHeight = 0;
    
    // Columna derecha - Imagen del vehículo (primero para calcular altura)
    if (data.vehicleImageUrl) {
      try {
        // Intentar cargar la imagen
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve) => {
          img.onload = () => {
            try {
              // Redimensionar imagen si es muy grande (máximo 50x35 mm)
              const maxWidth = 50;
              const maxHeight = 35;
              let imgWidth = img.width;
              let imgHeight = img.height;
              
              const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
              imgWidth = imgWidth * ratio;
              imgHeight = imgHeight * ratio;
              
              // Agregar imagen al PDF en la columna derecha
              doc.addImage(img, 'JPEG', 130, yStart + 8, imgWidth, imgHeight);
              imageHeight = imgHeight;
              resolve();
            } catch (error) {
              console.error('Error agregando imagen al PDF:', error);
              resolve(); // Continuar sin imagen
            }
          };
          img.onerror = () => {
            console.error('Error cargando imagen del vehículo');
            resolve(); // Continuar sin imagen
          };
          img.src = data.vehicleImageUrl;
        });
      } catch (error) {
        console.error('Error procesando imagen:', error);
      }
    }
    
    // Información del vehículo en columna izquierda
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    
    // Columna izquierda - Datos del vehículo
    if (vehicleInfo.marcaModelo && vehicleInfo.marcaModelo !== vehiculoStr) {
      doc.setFont('helvetica', 'bold');
      doc.text('Marca/Modelo:', 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(vehicleInfo.marcaModelo, 60, currentY);
      currentY += 7;
    }
    
    if (vehicleInfo.vin) {
      doc.setFont('helvetica', 'bold');
      doc.text('VIN:', 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(vehicleInfo.vin, 60, currentY);
      currentY += 7;
    }
    
    if (vehicleInfo.color) {
      doc.setFont('helvetica', 'bold');
      doc.text('Color:', 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(vehicleInfo.color, 60, currentY);
      currentY += 7;
    }
    
    if (vehicleInfo.precio) {
      doc.setFont('helvetica', 'bold');
      doc.text('Precio:', 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(46, 204, 113); // Verde para el precio
      doc.setFont('helvetica', 'bold');
      doc.text(this.formatCurrency(vehicleInfo.precio), 60, currentY);
      doc.setTextColor(...darkGray);
      currentY += 7;
    }
    
    // Actualizar posición Y para la siguiente sección (usar la mayor entre datos e imagen)
    doc.lastVehicleY = Math.max(currentY, yStart + 8 + imageHeight) + 10;
  }

  async addHeader(doc, data) {
    // Diseño ultra profesional y elegante
    const darkBlue = [25, 42, 86];
    const darkGray = [44, 62, 80];
    const lightBlue = [52, 152, 219];
    const accentBlue = [41, 128, 185];
    
    // Barra decorativa superior más elegante
    doc.setFillColor(...lightBlue);
    doc.rect(0, 0, 210, 8, 'F');
    
    // Logo/Icono de empresa más grande y elegante
    doc.setFillColor(...darkBlue);
    doc.roundedRect(20, 18, 12, 12, 2, 2, 'F');
    doc.setDrawColor(...accentBlue);
    doc.setLineWidth(1.5);
    doc.roundedRect(20, 18, 12, 12, 2, 2, 'S');
    
    // Nombre de la empresa más prominente
    doc.setTextColor(...darkGray);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICIOS EMPRESARIALES Y GENERALES TRÉBOL', 38, 28);
    
    // Subtítulo más elegante
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Financiamiento Automotriz', 38, 34);
    
    // Título del documento más prominente
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Cotización de Servicios', 20, 48);
    
    // Línea decorativa más gruesa bajo el título
    doc.setDrawColor(...accentBlue);
    doc.setLineWidth(2);
    doc.line(20, 50, 75, 50);
    
    // Elementos decorativos más elegantes en esquina superior derecha
    doc.setFillColor(...accentBlue);
    doc.circle(185, 15, 3, 'F');
    doc.circle(185, 22, 2.5, 'F');
    doc.circle(185, 28, 2, 'F');
    
    // Barra decorativa inferior más elegante
    doc.setFillColor(...lightBlue);
    doc.rect(0, 280, 210, 8, 'F');
  }

  async addClientInfo(doc, data) {
    const yStart = 58;
    const darkBlue = [25, 42, 86];
    const darkGray = [44, 62, 80];
    const accentBlue = [41, 128, 185];
    
    // Datos del Cliente (columna izquierda) con diseño más elegante
    doc.setFontSize(13);
    doc.setTextColor(...darkBlue);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 20, yStart);
    
    // Línea decorativa más elegante bajo el título
    doc.setDrawColor(...accentBlue);
    doc.setLineWidth(1.5);
    doc.line(20, yStart + 2, 90, yStart + 2);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    
    // Nombre completo del cliente
    const nombreCompleto = data.client?.nombre 
      ? `${data.client.nombre}${data.client.apellidos ? ' ' + data.client.apellidos : ''}`.trim()
      : 'Cliente';
    doc.text(nombreCompleto, 20, yStart + 10);
    
    // ID del cliente si está disponible
    if (data.client?.id_cliente) {
      doc.setFont('helvetica', 'bold');
      doc.text('ID:', 20, yStart + 16);
      doc.setFont('helvetica', 'normal');
      doc.text(`#${data.client.id_cliente}`, 50, yStart + 16);
    }
    
    doc.text(data.client?.telefono || 'N/A', 20, yStart + 22);
    doc.text(data.client?.email || 'N/A', 20, yStart + 28);
    
    // Datos del Emisor (columna derecha) con diseño más elegante
    doc.setFontSize(13);
    doc.setTextColor(...darkBlue);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EMISOR', 120, yStart);
    
    // Línea decorativa más elegante bajo el título
    doc.setDrawColor(...accentBlue);
    doc.setLineWidth(1.5);
    doc.line(120, yStart + 2, 190, yStart + 2);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.text('SERVICIOS EMPRESARIALES Y GENERALES TRÉBOL', 120, yStart + 10);
    doc.text('Dirección Empresa', 120, yStart + 16);
    doc.text('Teléfono Empresa', 120, yStart + 22);
    doc.text('info@trebol.com', 120, yStart + 28);
    
    // Número de cotización
    if (data.number) {
      doc.setFont('helvetica', 'bold');
      doc.text('Cotización Nro.:', 120, yStart + 34);
      doc.setFont('helvetica', 'normal');
      doc.text(data.number, 160, yStart + 34);
    }
    
    // Elementos decorativos más elegantes
    doc.setFillColor(...accentBlue);
    doc.circle(18, yStart + 1, 2, 'F');
    doc.circle(118, yStart + 1, 2, 'F');
  }

  addItemsTable(doc, data) {
    // Usar la posición Y de la sección anterior o un valor por defecto
    const yStart = doc.lastVehicleY || 150;
    const darkBlue = [25, 42, 86];
    const accentBlue = [41, 128, 185];
    
    // Título de la tabla más elegante
    doc.setFontSize(14);
    doc.setTextColor(...darkBlue);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE PRODUCTOS Y SERVICIOS', 20, yStart);
    
    // Línea decorativa más elegante bajo el título
    doc.setDrawColor(...accentBlue);
    doc.setLineWidth(1.5);
    doc.line(20, yStart + 2, 130, yStart + 2);
    
    // Preparar datos para la tabla
    // Si hay información del vehículo, usarla como item principal
    const vehiculoStr = data.vehiculo || data.items?.[0]?.descripcion || '';
    const vehicleInfo = this.extractVehicleInfo(vehiculoStr);
    
    let tableData = [];
    
    if (data.items && data.items.length > 0) {
      tableData = data.items.map(item => [
        item.descripcion || 'Producto/Servicio',
        String(item.cantidad || 1),
        this.formatCurrency(item.precio_unitario || 0),
        this.formatCurrency((item.precio_unitario || 0) * (item.cantidad || 1))
      ]);
    } else if (vehicleInfo) {
      // Si no hay items pero hay información del vehículo, crear un item
      tableData = [[
        vehicleInfo.marcaModelo || 'Vehículo',
        '1',
        vehicleInfo.precio ? this.formatCurrency(vehicleInfo.precio) : '$ 0,00',
        vehicleInfo.precio ? this.formatCurrency(vehicleInfo.precio) : '$ 0,00'
      ]];
    } else {
      tableData = [['Producto/Servicio', '1', '$ 0,00', '$ 0,00']];
    }
    
    // Configuración de la tabla limpia, centrada y sin marcos
    autoTable(doc, {
      startY: yStart + 8,
      head: [['Producto', 'Cantidad', 'Precio', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: darkBlue,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center',
        cellPadding: 8,
        lineColor: [255, 255, 255],
        lineWidth: 1
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [0, 0, 0],
        halign: 'left',
        cellPadding: 6,
        lineColor: [150, 150, 150],
        lineWidth: 0.8
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 90 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 }
      },
      margin: { left: 25, right: 25 },
      styles: {
        lineColor: [150, 150, 150],
        lineWidth: 1,
        cellPadding: 6
      },
      tableLineColor: [150, 150, 150],
      tableLineWidth: 1
    });
  }

  async addTotals(doc, data) {
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 200;
    const darkBlue = [25, 42, 86];
    const darkGray = [44, 62, 80];
    const accentBlue = [41, 128, 185];
    
    // Calcular totales
    let subtotal = 0;
    
    if (data.items && data.items.length > 0) {
      subtotal = data.items.reduce((sum, item) => sum + ((item.precio_unitario || 0) * (item.cantidad || 1)), 0);
    } else {
      // Si no hay items, usar el precio del vehículo
      const vehiculoStr = data.vehiculo || '';
      const vehicleInfo = this.extractVehicleInfo(vehiculoStr);
      if (vehicleInfo && vehicleInfo.precio) {
        subtotal = vehicleInfo.precio;
      }
    }
    
    const iva = subtotal * 0.18; // 18% IGV como en el modelo
    const total = subtotal + iva;
    
    // Totales con diseño más elegante y profesional
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    
    // Subtotal
    doc.text('Subtotal', 150, finalY, { align: 'right' });
    doc.text(this.formatCurrency(subtotal), 190, finalY, { align: 'right' });
    
    // IGV
    doc.text('IGV (18%)', 150, finalY + 10, { align: 'right' });
    doc.text(this.formatCurrency(iva), 190, finalY + 10, { align: 'right' });
    
    // Línea separadora elegante
    doc.setDrawColor(...accentBlue);
    doc.setLineWidth(1);
    doc.line(150, finalY + 15, 190, finalY + 15);
    
    // Total destacado con diseño más prominente
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkBlue);
    doc.text('TOTAL', 150, finalY + 25, { align: 'right' });
    doc.text(this.formatCurrency(total), 190, finalY + 25, { align: 'right' });
  }

  async addFooter(doc, data) {
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 85;
    const darkBlue = [25, 42, 86];
    const darkGray = [44, 62, 80];
    const accentBlue = [41, 128, 185];
    
    // Sección de Condiciones con diseño más elegante
    doc.setFontSize(13);
    doc.setTextColor(...darkBlue);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDICIONES', 20, footerY);
    
    // Línea decorativa más elegante bajo el título
    doc.setDrawColor(...accentBlue);
    doc.setLineWidth(1.5);
    doc.line(20, footerY + 2, 85, footerY + 2);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.text('• Forma de pago: Transferencia bancaria / Depósito', 20, footerY + 12);
    doc.text('• Vigencia de la cotización: 7 días naturales', 20, footerY + 18);
    doc.text('• Tiempo estimado de entrega: 5 días hábiles a partir del pago', 20, footerY + 24);
    doc.text('• Incluye: Número de revisiones, formatos de entrega, etc.', 20, footerY + 30);
    
    // Información de contacto con diseño más elegante
    doc.setFontSize(11);
    doc.setTextColor(...darkBlue);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DE CONTACTO', 20, footerY + 45);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.text('📧 info@trebol.com', 20, footerY + 53);
    doc.text('🌐 www.trebol.com', 20, footerY + 59);
    doc.text('📞 Teléfono Empresa', 20, footerY + 65);
    doc.text('📍 Dirección Empresa', 20, footerY + 71);
    
    // Elementos decorativos más elegantes
    doc.setFillColor(...accentBlue);
    doc.circle(18, footerY + 1, 2, 'F');
    doc.circle(18, footerY + 46, 2, 'F');
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  numberToWords(number) {
    // Función simplificada para convertir números a palabras
    const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    
    if (number === 0) return 'cero pesos';
    if (number < 10) return ones[Math.floor(number)] + ' pesos';
    if (number < 20) return teens[Math.floor(number) - 10] + ' pesos';
    if (number < 100) {
      const ten = Math.floor(number / 10);
      const one = Math.floor(number % 10);
      return tens[ten] + (one > 0 ? ' y ' + ones[one] : '') + ' pesos';
    }
    
    return Math.floor(number).toLocaleString('es-CO') + ' pesos';
  }

  // Método para generar PDF de comprobante de pago
  generatePaymentReceipt(paymentData) {
    const doc = new jsPDF();
    
    // Usar el mismo diseño simple
    this.addHeader(doc, paymentData);
    this.addClientInfo(doc, paymentData);
    this.addFooter(doc, paymentData);
    
    return doc;
  }

}

export default PDFGenerator;
