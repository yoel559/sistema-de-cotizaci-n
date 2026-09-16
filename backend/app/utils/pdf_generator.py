import os
import tempfile
import re
import logging
from decimal import Decimal
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from ..models.quotation import Quotation

logger = logging.getLogger(__name__)


def generate_quotation_pdf(quotation: Quotation) -> str:
    """Generar PDF de cotización"""
    # Crear archivo temporal
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_path = temp_file.name
    temp_file.close()
    
    # Crear documento
    doc = SimpleDocTemplate(temp_path, pagesize=A4)
    story = []
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    # Título
    story.append(Paragraph("COTIZACIÓN", title_style))
    story.append(Spacer(1, 20))
    
    # Extraer precio del vehículo del string si está presente
    precio_vehiculo = None
    precio_match = re.search(r'Precio:\s*\$?([\d,]+\.?\d*)', quotation.vehiculo)
    if precio_match:
        try:
            precio_str = precio_match.group(1).replace(',', '')
            precio_vehiculo = Decimal(precio_str)
        except:
            precio_vehiculo = None
    
    # Información de tipo de pago
    tipo_pago_text = "CONTADO (Pago Completo)"
    es_financiado = False
    
    # LOG DE DEPURACIÓN - Verificar qué tiene la cotización
    logger.info(f"=== DEBUG: Generando PDF para cotización ID: {quotation.id_cotizacion}")
    logger.info(f"=== DEBUG: Tipo de cotización: {type(quotation)}")
    logger.info(f"=== DEBUG: Atributos disponibles: {dir(quotation)}")
    
    # Verificar y procesar tipo de pago - intentar múltiples formas de acceso
    tipo_pago_value = None
    try:
        # Intentar acceder directamente al atributo
        tipo_pago_value = getattr(quotation, 'tipo_pago', None)
        logger.info(f"=== DEBUG: tipo_pago desde getattr: {tipo_pago_value} (tipo: {type(tipo_pago_value)})")
        
        # Si es None, intentar acceder como diccionario
        if tipo_pago_value is None and hasattr(quotation, '__dict__'):
            tipo_pago_value = quotation.__dict__.get('tipo_pago', None)
            logger.info(f"=== DEBUG: tipo_pago desde __dict__: {tipo_pago_value}")
        
        # Intentar acceder como si fuera un objeto SQLAlchemy
        if tipo_pago_value is None:
            try:
                tipo_pago_value = quotation.tipo_pago
                logger.info(f"=== DEBUG: tipo_pago acceso directo: {tipo_pago_value}")
            except AttributeError:
                logger.warning("=== DEBUG: No se encontró atributo tipo_pago en el objeto")
    except Exception as e:
        logger.error(f"=== DEBUG: Error al acceder a tipo_pago: {e}", exc_info=True)
        tipo_pago_value = None
    
    logger.info(f"=== DEBUG: Valor final de tipo_pago_value: {tipo_pago_value}")
    
    if tipo_pago_value:
        tipo_pago_lower = str(tipo_pago_value).lower().strip()
        logger.info(f"=== DEBUG: tipo_pago_lower: '{tipo_pago_lower}'")
        if tipo_pago_lower == "financiado":
            tipo_pago_text = "FINANCIADO (50% de enganche)"
            es_financiado = True
            logger.info("=== DEBUG: Tipo de pago establecido como FINANCIADO")
        elif tipo_pago_lower == "contado":
            tipo_pago_text = "CONTADO (Pago Completo)"
            logger.info("=== DEBUG: Tipo de pago establecido como CONTADO")
    else:
        logger.warning("=== DEBUG: tipo_pago_value es None o vacío, usando valor por defecto CONTADO")
    # Si no hay tipo_pago, ya está en "CONTADO (Pago Completo)" por defecto
    
    logger.info(f"=== DEBUG: tipo_pago_text final: '{tipo_pago_text}'")
    logger.info(f"=== DEBUG: es_financiado: {es_financiado}")
    
    quotation_info = [
        ['Número de Cotización:', quotation.numero_cotizacion],
        ['Vehículo:', quotation.vehiculo],
        ['Estado:', str(quotation.estado).upper()],
        ['Tipo de Pago:', tipo_pago_text],
        ['Fecha registro:', quotation.fecha_registro.strftime('%d/%m/%Y')],
        ['Fecha seguimiento:', quotation.fecha_seguimiento.strftime('%d/%m/%Y')],
    ]
    
    # Encontrar el índice de la fila de tipo de pago para destacarla
    tipo_pago_row_index = 3  # Índice de la fila "Tipo de Pago"
    
    quotation_table = Table(quotation_info, colWidths=[2*inch, 4*inch])
    table_style = [
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTSIZE', (1, tipo_pago_row_index), (1, tipo_pago_row_index), 12),  # Hacer más grande el tipo de pago
        ('FONTNAME', (1, tipo_pago_row_index), (1, tipo_pago_row_index), 'Helvetica-Bold'),  # Hacer negrita el tipo de pago
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (0, -1), colors.grey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        # Destacar la fila de tipo de pago
        ('BACKGROUND', (1, tipo_pago_row_index), (1, tipo_pago_row_index), colors.HexColor('#fef3c7') if es_financiado else colors.HexColor('#d1fae5')),  # Amarillo claro si financiado, verde claro si contado
        ('TEXTCOLOR', (1, tipo_pago_row_index), (1, tipo_pago_row_index), colors.HexColor('#92400e') if es_financiado else colors.HexColor('#065f46')),  # Marrón oscuro si financiado, verde oscuro si contado
    ]
    quotation_table.setStyle(TableStyle(table_style))
    
    story.append(quotation_table)
    story.append(Spacer(1, 20))
    
    # Sección destacada de información de pago
    payment_style = ParagraphStyle(
        'PaymentInfo',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#1e40af')  # Azul oscuro
    )
    
    story.append(Paragraph("INFORMACIÓN DE PAGO", payment_style))
    
    # Función para formatear números en formato mexicano
    def format_currency(amount):
        """Formatear cantidad en formato mexicano: $XX,XXX.XX"""
        return f"${amount:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    
    # Tabla de información de pago
    payment_info = []
    
    if precio_vehiculo:
        precio_formateado = format_currency(float(precio_vehiculo))
        payment_info.append(['Precio del Vehículo:', precio_formateado])
        
        if es_financiado:
            enganche = precio_vehiculo * Decimal('0.5')
            saldo = precio_vehiculo - enganche
            payment_info.append(['Tipo de Pago:', tipo_pago_text])
            payment_info.append(['Enganche (50%):', format_currency(float(enganche))])
            payment_info.append(['Saldo a Financiar:', format_currency(float(saldo))])
        else:
            payment_info.append(['Tipo de Pago:', tipo_pago_text])
            payment_info.append(['Pago Total:', precio_formateado])
    else:
        payment_info.append(['Tipo de Pago:', tipo_pago_text])
        if es_financiado:
            payment_info.append(['Nota:', 'Enganche del 50% del precio del vehículo'])
        else:
            payment_info.append(['Nota:', 'Pago completo al momento de la compra'])
    
    payment_table = Table(payment_info, colWidths=[2.5*inch, 3.5*inch])
    payment_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('FONTSIZE', (1, 0), (1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#3b82f6')),  # Azul
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#dbeafe')),  # Azul claro
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#1e40af')),
    ]))
    
    story.append(payment_table)
    story.append(Spacer(1, 20))
    
    # Tabla de productos/vehículos
    story.append(Paragraph("DETALLE DE PRODUCTOS", payment_style))
    story.append(Spacer(1, 10))
    
    # Extraer información del vehículo del string
    vehiculo_nombre = quotation.vehiculo
    # Intentar extraer solo el nombre del vehículo (sin precio, VIN, etc.)
    vehiculo_limpio = re.sub(r'\s*-\s*VIN:.*', '', vehiculo_nombre)
    vehiculo_limpio = re.sub(r'\s*-\s*Color:.*', '', vehiculo_limpio)
    vehiculo_limpio = re.sub(r'\s*-\s*Precio:.*', '', vehiculo_limpio)
    vehiculo_limpio = vehiculo_limpio.strip()
    
    # Crear tabla de productos
    productos_headers = ['Producto', 'Cantidad', 'Precio Unitario', 'Total']
    productos_data = [productos_headers]
    
    # Agregar el vehículo como producto
    cantidad = "1"
    precio_unitario = format_currency(float(precio_vehiculo)) if precio_vehiculo else "$0.00"
    total = precio_unitario
    
    # Agregar tipo de pago en el nombre del producto o como información adicional
    producto_con_pago = vehiculo_limpio
    if es_financiado:
        producto_con_pago = f"{vehiculo_limpio} [FINANCIADO - 50% enganche]"
    else:
        producto_con_pago = f"{vehiculo_limpio} [CONTADO - Pago completo]"
    
    productos_data.append([producto_con_pago, cantidad, precio_unitario, total])
    
    productos_table = Table(productos_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
    productos_table.setStyle(TableStyle([
        # Headers
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),  # Azul oscuro
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        # Datos
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, 1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 8),
        ('TOPPADDING', (0, 1), (-1, 1), 8),
        # Bordes
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#1e40af')),
        # Destacar la fila de datos si es financiado
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#fef3c7') if es_financiado else colors.HexColor('#d1fae5')),
    ]))
    
    story.append(productos_table)
    story.append(Spacer(1, 20))
    
    # Resumen de totales con IGV
    if precio_vehiculo:
        subtotal = precio_vehiculo
        igv = subtotal * Decimal('0.18')  # IGV 18%
        total_con_igv = subtotal + igv
        
        totales_data = [
            ['Subtotal:', format_currency(float(subtotal))],
            ['IGV (18%):', format_currency(float(igv))],
            ['TOTAL:', format_currency(float(total_con_igv))]
        ]
        
        totales_table = Table(totales_data, colWidths=[2*inch, 2*inch])
        totales_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -2), 11),
            ('FONTSIZE', (1, 0), (1, -2), 11),
            ('FONTSIZE', (0, 2), (1, 2), 14),  # Total más grande
            ('FONTNAME', (0, 2), (1, 2), 'Helvetica-Bold'),  # Total en negrita
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('TEXTCOLOR', (1, 2), (1, 2), colors.HexColor('#059669')),  # Verde para el total
            ('LINEBELOW', (0, 1), (1, 1), 1, colors.grey),  # Línea antes del total
        ]))
        
        story.append(Spacer(1, 10))
        story.append(totales_table)
        story.append(Spacer(1, 20))
    
    # Notas adicionales
    story.append(Spacer(1, 30))
    story.append(Paragraph("NOTAS:", styles['Heading3']))
    story.append(Paragraph("• Esta cotización es válida por 30 días desde la fecha de emisión.", styles['Normal']))
    story.append(Paragraph("• Los precios están sujetos a cambios sin previo aviso.", styles['Normal']))
    story.append(Paragraph("• Para cualquier consulta, contacte a nuestro equipo de ventas.", styles['Normal']))
    
    # Pie de página
    story.append(Spacer(1, 40))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    story.append(Paragraph(f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} - Sistema de Trading", footer_style))
    
    # Construir PDF
    doc.build(story)
    
    return temp_path


def cleanup_pdf_file(file_path: str):
    """Limpiar archivo PDF temporal"""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
    except Exception:
        pass  # Ignorar errores de limpieza
