# ANEXOS - TIPOS DE FOTOS Y CAPTURAS DE PANTALLA NECESARIAS

## A. CAPTURAS DE PANTALLA DEL SISTEMA

### A.1. Interfaz Principal y Navegación

1. **Pantalla de Login**
   - Formulario de inicio de sesión
   - Validación de credenciales
   - Mensaje de bienvenida

2. **Dashboard Principal**
   - Vista general del sistema
   - KPIs y métricas principales
   - Gráficos y estadísticas
   - Menú de navegación lateral

3. **Menú de Navegación**
   - Estructura completa del menú
   - Iconos y opciones disponibles
   - Navegación por módulos

### A.2. Módulo de Gestión de Clientes

4. **Lista de Clientes**
   - Tabla con todos los clientes
   - Filtros y búsqueda
   - Paginación

5. **Formulario de Creación de Cliente**
   - Campos del formulario
   - Validaciones
   - Botones de acción

6. **Detalles de Cliente**
   - Información completa del cliente
   - Historial de cotizaciones
   - Historial de compras

7. **Edición de Cliente**
   - Formulario de edición
   - Campos editables

### A.3. Módulo de Inventario

8. **Lista de Vehículos**
   - Tabla con vehículos disponibles
   - Imágenes de vehículos
   - Filtros por marca, modelo, precio

9. **Formulario de Creación de Vehículo**
   - Campos: marca, modelo, color, VIN, precio
   - Carga de imagen
   - Estado de disponibilidad

10. **Detalles de Vehículo**
    - Información completa
    - Imagen del vehículo
    - Precio y disponibilidad

11. **Edición de Vehículo**
    - Formulario de edición
    - Cambio de precio
    - Cambio de disponibilidad
    - Actualización de imagen

### A.4. Módulo de Cotizaciones

12. **Lista de Cotizaciones**
    - Tabla con todas las cotizaciones
    - Estados (frío, tibio, caliente)
    - Filtros y búsqueda

13. **Formulario de Creación de Cotización**
    - Selección de cliente
    - Selección de vehículo
    - Tipo de pago (contado/financiado)
    - Resumen de cotización

14. **Detalles de Cotización**
    - Información completa
    - Cliente asociado
    - Vehículo cotizado
    - Estado y fechas

15. **Edición de Cotización**
    - Formulario de edición de estado
    - Campos editables

16. **Vista de Impresión de Cotización**
    - Vista previa del PDF
    - Información de pago
    - Cálculo de IGV (18%)
    - Total con impuestos

17. **PDF Generado de Cotización**
    - Documento PDF completo
    - Encabezado con logo
    - Información del cliente
    - Detalles del vehículo
    - Cálculos de IGV
    - Sección de información de pago

### A.5. Módulo de Pagos

18. **Lista de Cronogramas de Pago**
    - Tabla con cronogramas
    - Información de cotización asociada
    - Estados de pagos

19. **Formulario de Creación de Cronograma**
    - Selección de cotización
    - Tipo de pago
    - Monto total
    - Generación automática de cuotas

20. **Detalles de Cronograma**
    - Información del cronograma
    - Lista de cuotas
    - Fechas de vencimiento
    - Estados de cada cuota

### A.6. Módulo de Créditos

21. **Lista de Aplicaciones de Crédito**
    - Tabla con aplicaciones
    - Estados de aprobación
    - Información del cliente

22. **Formulario de Aplicación de Crédito**
    - Campos del formulario
    - Documentos requeridos
    - Información financiera

### A.7. Módulo de Entregas

23. **Lista de Entregas**
    - Tabla con entregas programadas
    - Estados de entrega
    - Fechas y vehículos

24. **Formulario de Registro de Entrega**
    - Información de entrega
    - Documentos de entrega
    - Firma del cliente

### A.8. Sistema de Alertas

25. **Panel de Alertas**
    - Lista de alertas activas
    - Tipos de alertas
    - Notificaciones en tiempo real

26. **Configuración de Alertas**
    - Opciones de configuración
    - Tipos de alertas disponibles

### A.9. Chatbot con Inteligencia Artificial

27. **Interfaz del Chatbot**
    - Ventana de chat
    - Botón flotante
    - Historial de conversación

28. **Ejemplo de Conversación con Chatbot**
    - Pregunta del usuario
    - Respuesta del chatbot
    - Contexto del negocio

29. **Selección de Modelo de IA**
    - Lista de modelos disponibles
    - Configuración del modelo

### A.10. Gestión de Usuarios

30. **Lista de Usuarios**
    - Tabla con usuarios del sistema
    - Roles asignados
    - Estados de usuarios

31. **Formulario de Creación de Usuario**
    - Campos: nombre, correo, contraseña, teléfono
    - Selección de rol
    - Asignación de permisos

32. **Perfil de Usuario**
    - Información del usuario
    - Rol y permisos
    - Actividad reciente

### A.11. Reportes y Estadísticas

33. **Dashboard con Gráficos**
    - Gráficos de ventas
    - Estadísticas de cotizaciones
    - Métricas de rendimiento

34. **Reportes Generados**
    - Reportes de ventas
    - Reportes de inventario
    - Reportes financieros

## B. DIAGRAMAS Y ARQUITECTURA

### B.1. Diagramas Técnicos

35. **Diagrama de Arquitectura del Sistema**
    - Arquitectura de microservicios
    - Separación frontend/backend
    - Base de datos

36. **Diagrama de Base de Datos (ER)**
    - Modelo entidad-relación
    - Relaciones entre tablas
    - Estructura de datos

37. **Diagrama de Flujo de Procesos**
    - Flujo de creación de cotización
    - Flujo de proceso de venta
    - Flujo de gestión de pagos

38. **Diagrama de Casos de Uso**
    - Casos de uso principales
    - Actores del sistema
    - Relaciones

### B.2. Diagramas de Secuencia

39. **Secuencia de Creación de Cotización**
    - Interacción usuario-sistema
    - Llamadas a API
    - Procesamiento de datos

40. **Secuencia de Comunicación WebSocket**
    - Conexión WebSocket
    - Envío de notificaciones
    - Actualización en tiempo real

## C. CONFIGURACIÓN Y DESPLIEGUE

### C.1. Configuración del Sistema

41. **Estructura de Carpetas del Proyecto**
    - Organización del código
    - Backend y frontend
    - Archivos de configuración

42. **Archivo de Configuración Principal**
    - Variables de entorno
    - Configuración de base de datos
    - Configuración de servicios

43. **Configuración de Base de Datos**
    - Esquema de tablas
    - Relaciones
    - Índices

### C.2. Instalación y Despliegue

44. **Proceso de Instalación**
    - Instalación de dependencias
    - Configuración inicial
    - Primera ejecución

45. **Servidor en Funcionamiento**
    - Terminal con servidor ejecutando
    - Logs del sistema
    - Estado de servicios

46. **Interfaz de Administración**
    - Panel de administración
    - Configuraciones del sistema
    - Monitoreo

## D. DOCUMENTACIÓN TÉCNICA

### D.1. Código Fuente

47. **Estructura de Código Backend**
    - Organización de módulos
    - Archivos principales
    - Servicios y endpoints

48. **Estructura de Código Frontend**
    - Componentes React
    - Páginas principales
    - Servicios de API

49. **Ejemplo de Código Clave**
    - Endpoint de API
    - Servicio de negocio
    - Componente React

### D.2. Configuración de Tecnologías

50. **Configuración de Ollama**
    - Instalación de Ollama
    - Modelos descargados
    - Configuración de conexión

51. **Configuración de Base de Datos**
    - Conexión a PostgreSQL/SQLite
    - Migraciones
    - Datos de prueba

## E. RESULTADOS Y PRUEBAS

### E.1. Pruebas Funcionales

52. **Prueba de Creación de Cotización**
    - Antes: formulario vacío
    - Durante: llenando formulario
    - Después: cotización creada exitosamente

53. **Prueba de Generación de PDF**
    - Proceso de generación
    - PDF resultante
    - Verificación de cálculos

54. **Prueba del Chatbot**
    - Pregunta realizada
    - Respuesta generada
    - Verificación de contexto

### E.2. Pruebas de Rendimiento

55. **Métricas de Rendimiento**
    - Tiempo de respuesta
    - Uso de recursos
    - Rendimiento de base de datos

56. **Pruebas de Carga**
    - Múltiples usuarios simultáneos
    - Rendimiento bajo carga
    - Escalabilidad

## F. COMPARATIVAS Y MEJORAS

### F.1. Antes y Después

57. **Proceso Manual vs Automatizado**
    - Antes: proceso manual (Excel/Word)
    - Después: proceso automatizado en sistema

58. **Tiempo de Procesamiento**
    - Comparativa de tiempos
    - Reducción de tiempo
    - Mejora en eficiencia

### F.2. Mejoras Implementadas

59. **Reducción de Errores**
    - Errores antes del sistema
    - Errores después del sistema
    - Comparativa

60. **Mejora en Experiencia de Usuario**
    - Interfaz anterior (si existe)
    - Interfaz nueva
    - Comparativa

## G. DOCUMENTOS Y REPORTES

### G.1. Documentos Generados

61. **Cotización PDF Completa**
    - Documento completo
    - Formato profesional
    - Información detallada

62. **Reportes del Sistema**
    - Reportes de ventas
    - Reportes de inventario
    - Reportes financieros

### G.2. Manuales y Guías

63. **Manual de Usuario**
    - Portada del manual
    - Secciones principales
    - Guías de uso

64. **Documentación Técnica**
    - Documentación de API
    - Guía de instalación
    - Guía de configuración

## H. RECOMENDACIONES PARA LAS FOTOS

### Calidad y Formato

- **Formato**: PNG o JPG de alta calidad
- **Resolución**: Mínimo 1920x1080 para capturas de pantalla
- **Nombres descriptivos**: Usar nombres claros (ej: "01_login.png", "02_dashboard.png")
- **Marcas de agua**: Opcional, pero recomendado para protección
- **Anotaciones**: Agregar flechas o texto explicativo cuando sea necesario

### Organización

- **Carpetas por módulo**: Organizar fotos por sección del sistema
- **Numeración secuencial**: Usar números para orden lógico
- **Índice de imágenes**: Crear un documento con descripción de cada imagen

### Contenido

- **Datos de prueba**: Usar datos realistas pero no sensibles
- **Información consistente**: Mantener misma información en fotos relacionadas
- **Vistas completas**: Mostrar pantallas completas cuando sea posible
- **Detalles importantes**: Incluir zoom o recortes de áreas importantes

---

**Total de Fotos Recomendadas**: 64  
**Categorías**: 8 (Sistema, Diagramas, Configuración, Documentación, Pruebas, Comparativas, Documentos, Recomendaciones)

