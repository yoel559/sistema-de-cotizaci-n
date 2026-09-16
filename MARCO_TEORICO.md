# 2.5. MARCO TEÓRICO Y CONCEPTUAL

## 2.5.1. FUNDAMENTO TEÓRICO DEL PROYECTO DE INNOVACIÓN / MEJORA / CREATIVIDAD

### INTRODUCCIÓN

El presente proyecto consiste en el desarrollo e implementación de un **Sistema ERP (Enterprise Resource Planning) Inteligente para la Gestión de Ventas de Vehículos**, denominado "Servicios Empresariales y Generales Trébol - Financiamiento Automotriz". Este sistema integra tecnologías de vanguardia en inteligencia artificial, arquitectura de microservicios, comunicación en tiempo real y gestión documental para optimizar los procesos comerciales del sector automotriz.

### FUNDAMENTOS TEÓRICOS

#### Sistemas ERP (Enterprise Resource Planning)

Los Sistemas ERP son plataformas integradas de gestión empresarial que permiten la administración centralizada de todos los procesos de negocio. Un ERP eficiente debe integrar procesos (inventario, ventas, finanzas, clientes), proporcionar trazabilidad completa de operaciones y automatizar procesos repetitivos. En este proyecto, el ERP gestiona inventario de vehículos, clientes, proceso de ventas, gestión financiera y control documental con generación automática de cotizaciones en PDF.

#### Arquitectura de Microservicios y API REST

La arquitectura de microservicios estructura una aplicación como una colección de servicios débilmente acoplados. El backend (FastAPI) implementa una API RESTful con endpoints organizados por módulos, permitiendo escalabilidad independiente. El frontend (React) utiliza arquitectura de componentes con gestión de estado mediante React Query y routing dinámico para navegación.

#### Inteligencia Artificial y Procesamiento de Lenguaje Natural (NLP)

El sistema incorpora un chatbot inteligente basado en modelos de lenguaje de gran escala (LLM) ejecutados localmente mediante Ollama. El chatbot utiliza NLP para comprender intenciones, mantener contexto empresarial y generar respuestas coherentes. La ejecución local garantiza privacidad de datos, reduce costos y permite personalización para el dominio específico del negocio.

#### Comunicación en Tiempo Real mediante WebSockets

Los WebSockets permiten comunicación bidireccional y en tiempo real entre servidor y clientes. Se implementan para notificaciones instantáneas, actualización automática de datos y difusión de eventos importantes. La teoría de sistemas distribuidos establece que la comunicación asíncrona mejora la experiencia del usuario eliminando la necesidad de recargar páginas.

#### Control de Acceso Basado en Roles (RBAC)

El sistema implementa un modelo de seguridad RBAC con separación de privilegios según roles (Empleado, Jefe Comercial, Gerente, Administrador), visibilidad de datos según jerarquía organizacional y auditoría completa. El principio de menor privilegio establece que cada usuario debe tener solo los permisos necesarios para su trabajo.

#### Gestión de Documentos y Generación de PDFs

El sistema genera automáticamente documentos comerciales en formato PDF, reduciendo errores humanos mediante automatización documental, aplicando correctamente impuestos (IGV 18%), descuentos y totales, e incluyendo información personalizada de empresa, cliente, vehículo y condiciones de pago.

#### Gestión de Flujos de Trabajo (Workflow Management)

El sistema implementa un flujo de trabajo estructurado con etapas: Prospecto, Orden de Compra, Contrato, Asignación, Entrega y Posventa. La teoría de gestión de procesos de negocio (BPM) establece que la estandarización de procesos mejora la eficiencia y reduce errores.

#### Arquitectura de Aplicaciones Web Modernas

El proyecto utiliza una arquitectura de tres capas: Capa de Presentación (React, Tailwind CSS, React Router), Capa de Lógica de Negocio (FastAPI, SQLAlchemy ORM, Pydantic) y Capa de Datos (SQLite/PostgreSQL con relaciones normalizadas).

### INNOVACIONES Y MEJORAS IMPLEMENTADAS

**Integración de Inteligencia Artificial Local**: Chatbot con modelos de lenguaje ejecutados localmente, proporcionando asistencia 24/7, reduciendo tiempo en consultas frecuentes y mejorando la experiencia del usuario.

**Sistema de Pagos Inteligente**: Generación automática de cronogramas de pago según tipo de financiamiento (contado o financiado), reduciendo errores en cálculos financieros y agilizando el proceso.

**Gestión de Inventario con Imágenes**: Sistema que permite almacenar y visualizar imágenes de vehículos, mejorando la experiencia de selección y reduciendo consultas sobre características físicas.

**Comunicación en Tiempo Real**: Implementación de WebSockets para notificaciones y actualizaciones instantáneas, mejorando la colaboración entre usuarios y reduciendo conflictos por datos desactualizados.

### METODOLOGÍA Y TECNOLOGÍAS

El proyecto sigue metodología ágil con desarrollo iterativo, pruebas continuas y documentación en código. Utiliza tecnologías modernas: Backend (FastAPI, SQLAlchemy, Pydantic, WebSockets, Ollama, ReportLab), Frontend (React, React Router, React Query, Axios, Tailwind CSS, jsPDF) y Base de Datos (SQLite/PostgreSQL).

### CONCLUSIONES DEL FUNDAMENTO TEÓRICO

El fundamento teórico se basa en la integración de múltiples disciplinas: Sistemas de Información Empresarial, Inteligencia Artificial, Arquitectura de Software Moderna, Seguridad Informática y Experiencia de Usuario. Este enfoque multidisciplinario permite crear un sistema que automatiza procesos, mejora la toma de decisiones, optimiza recursos y proporciona una experiencia superior para usuarios internos y clientes.

---

## 2.5.2. CONCEPTOS Y TÉRMINOS UTILIZADOS

### CONCEPTOS GENERALES

**ERP (Enterprise Resource Planning)**: Sistema de gestión empresarial que integra y automatiza procesos de negocio en una plataforma centralizada.

**Sistema de Gestión de Ventas**: Plataforma tecnológica para administrar el ciclo de vida de las ventas desde cotizaciones hasta seguimiento post-venta.

**Automatización de Procesos**: Implementación de tecnología para realizar tareas repetitivas sin intervención humana.

**Digitalización de Negocios**: Transformación de procesos comerciales mediante tecnologías digitales.

### CONCEPTOS DE ARQUITECTURA Y DESARROLLO

**Microservicios**: Arquitectura que estructura una aplicación como servicios independientes y débilmente acoplados.

**API REST**: Principios arquitectónicos para diseñar servicios web mediante operaciones HTTP estándar.

**Frontend**: Capa de presentación que interactúa directamente con el usuario.

**Backend**: Capa de lógica de negocio y procesamiento de datos.

**ORM (Object-Relational Mapping)**: Técnica que facilita la interacción con bases de datos relacionales.

**SPA (Single Page Application)**: Aplicación web que actualiza contenido dinámicamente sin recargar la página.

**WebSocket**: Protocolo de comunicación bidireccional y persistente para tiempo real.

### CONCEPTOS DE INTELIGENCIA ARTIFICIAL

**IA (Inteligencia Artificial)**: Capacidad de sistemas computacionales de realizar tareas que requieren inteligencia humana.

**LLM (Large Language Model)**: Modelo de lenguaje de gran escala para generar y procesar lenguaje natural.

**NLP (Natural Language Processing)**: Campo de IA enfocado en la interacción entre computadoras y lenguaje humano.

**Chatbot**: Sistema de software que simula conversaciones mediante procesamiento de lenguaje natural.

**Modelo de Lenguaje Local**: Modelo de IA ejecutado en infraestructura propia, garantizando privacidad.

**Ollama**: Framework de código abierto para ejecutar modelos de lenguaje localmente.

### CONCEPTOS DE SEGURIDAD Y ACCESO

**RBAC (Role-Based Access Control)**: Modelo de control de acceso basado en roles con permisos específicos.

**Autenticación**: Proceso de verificar la identidad de un usuario mediante credenciales.

**Autorización**: Proceso de determinar qué acciones y recursos puede acceder un usuario.

**Principio de Menor Privilegio**: Principio que establece que los usuarios deben tener solo permisos mínimos necesarios.

**Auditoría**: Registro y monitoreo de acciones realizadas por usuarios en el sistema.

### CONCEPTOS DE GESTIÓN DE DATOS

**Base de Datos Relacional**: Base de datos que organiza datos en tablas relacionadas mediante claves foráneas.

**Normalización**: Proceso de organizar datos para eliminar redundancias y dependencias.

**SQL (Structured Query Language)**: Lenguaje estándar para gestionar bases de datos relacionales.

**SQLite**: Sistema de gestión de bases de datos ligero y embebido.

**PostgreSQL**: Sistema de gestión de bases de datos robusto y escalable.

**Migración de Base de Datos**: Proceso de aplicar cambios estructurados al esquema de una base de datos.

### CONCEPTOS DE GESTIÓN DE DOCUMENTOS

**PDF (Portable Document Format)**: Formato de archivo para presentar documentos de manera independiente.

**Generación Automática de Documentos**: Proceso de crear documentos automáticamente mediante software.

**IGV (Impuesto General a las Ventas)**: Impuesto al valor agregado aplicado en Perú (18%).

**Cotización**: Documento comercial que presenta oferta de precio y condiciones de venta.

**Cronograma de Pago**: Planificación temporal de pagos con montos, fechas y número de cuotas.

### CONCEPTOS DE GESTIÓN DE PROCESOS

**Workflow (Flujo de Trabajo)**: Secuencia definida de pasos que debe seguir un proceso de negocio.

**BPM (Business Process Management)**: Disciplina que combina conocimiento de procesos con tecnologías.

**Estado de Proceso**: Etapa actual en la que se encuentra un proceso dentro de su flujo de trabajo.

**Trazabilidad**: Capacidad de rastrear el historial completo de un proceso desde su origen.

### CONCEPTOS DE GESTIÓN COMERCIAL

**Inventario**: Conjunto de productos disponibles para la venta con información de stock, precios y características.

**Cliente**: Persona o entidad que realiza compras con información de contacto e historial de transacciones.

**Prospecto**: Cliente potencial que ha mostrado interés pero aún no ha realizado compra confirmada.

**Venta**: Transacción comercial mediante la cual se transfiere propiedad a cambio de pago.

**Financiamiento**: Modalidad de pago mediante pagos diferidos en cuotas con intereses.

**Pago al Contado**: Modalidad donde el cliente realiza pago completo en una sola transacción.

### CONCEPTOS DE GESTIÓN FINANCIERA

**Cuota**: Pago periódico que forma parte de un plan de financiamiento, generalmente mensual.

**Interés**: Costo adicional por el uso de dinero prestado o financiamiento, expresado como porcentaje.

**Capital**: Monto principal de una deuda sin incluir intereses ni cargos adicionales.

**Amortización**: Proceso de reducir gradualmente una deuda mediante pagos periódicos.

**Aplicación de Crédito**: Proceso de solicitar financiamiento requiriendo evaluación y aprobación.

### CONCEPTOS TÉCNICOS DE DESARROLLO

**Framework**: Estructura de software reutilizable que proporciona funcionalidades comunes.

**Biblioteca**: Conjunto de funciones y clases predefinidas para realizar tareas específicas.

**Componente**: Unidad modular y reutilizable de código que encapsula funcionalidad específica.

**Estado (State)**: Datos que determinan el comportamiento y apariencia de una aplicación.

**Endpoint**: Punto de acceso específico en una API para realizar una operación mediante HTTP.

**Request/Response**: Mensajes de solicitud y respuesta entre cliente y servidor.

**Validación**: Proceso de verificar que los datos cumplen reglas y formatos requeridos.

**Error Handling**: Técnicas para detectar, gestionar y responder a errores.

### CONCEPTOS DE INTERFAZ DE USUARIO

**UI (User Interface)**: Conjunto de elementos visuales y controles para interactuar con una aplicación.

**UX (User Experience)**: Percepción y respuesta emocional de un usuario al interactuar con un sistema.

**Responsive Design**: Enfoque de diseño que permite adaptación a diferentes tamaños de pantalla.

**Componente Reutilizable**: Elemento de interfaz diseñado para uso múltiple manteniendo consistencia.

**Notificación**: Mensaje o alerta que informa sobre eventos importantes o cambios de estado.

**Dashboard**: Panel de control que presenta información resumida y visualizaciones de datos.

---

**Referencias Teóricas**:
- Laudon, K. C., & Laudon, J. P. (2016). *Management Information Systems: Managing the Digital Firm*. Pearson.
- Tanenbaum, A. S., & Van Steen, M. (2017). *Distributed Systems: Principles and Paradigms*. Pearson.
- Russell, S., & Norvig, P. (2020). *Artificial Intelligence: A Modern Approach*. Pearson.
- Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures*. University of California.
