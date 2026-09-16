# 4.2.1.6. Componente de Inteligencia Artificial

El software integra los siguientes componentes basados en técnicas de Inteligencia Artificial. Para cada uno se describe su tipo, tecnología empleada y principales características funcionales:

## Tipo de Componente

El sistema incorpora un **componente de Procesamiento de Lenguaje Natural (NLP)** basado en modelos de lenguaje de gran escala (Large Language Models - LLM), específicamente diseñado como un **sistema de asistencia conversacional inteligente** o chatbot. Este componente utiliza técnicas de generación de lenguaje natural para proporcionar asistencia contextualizada a los usuarios del sistema ERP, respondiendo consultas, guiando procesos y facilitando la interacción con el sistema mediante lenguaje natural.

## Tecnología o Framework Utilizado

El componente de IA utiliza **Ollama**, framework de código abierto para ejecutar modelos de lenguaje localmente, garantizando privacidad total de los datos y eliminando dependencias de servicios externos costosos.

**Modelos de Lenguaje Soportados**: Phi-3 Mini (modelo por defecto, ~2.3GB), Llama 3 (~4.7GB), Mistral (~4.1GB), y Llama 3.2 (~2GB).

**Tecnologías de Integración**: FastAPI (endpoints REST y WebSocket), httpx (cliente HTTP asíncrono), WebSockets (streaming en tiempo real), y SQLAlchemy (acceso a base de datos para contexto).

## Fuentes de Datos y Características Utilizadas

**Datos del Usuario**: Información de perfil (nombre, correo, rol organizacional) e historial de actividad (últimas cotizaciones creadas con detalles de vehículos, valores y estados).

**Datos del Negocio**: Base de datos de cotizaciones (número, vehículo, valor total, estado, fecha), base de datos de clientes (nombre, teléfono, preferencias, total registrados), y contexto organizacional sobre "Servicios Empresariales y Generales Trébol - Financiamiento Automotriz".

**Procesos de Preprocesamiento**: Detección de intención (análisis de mensaje para identificar acciones deseadas), extracción de contexto (consulta a BD para obtener información relevante), construcción de prompt contextualizado (integración de contexto, datos del negocio e intenciones), y gestión de historial de conversación (mantenimiento del contexto conversacional).

## Arquitectura del Modelo

El componente utiliza una **arquitectura de generación de lenguaje basada en Transformers** (modelos decoder-only pre-entrenados). El pipeline de procesamiento incluye: recepción de mensaje (REST o WebSocket), autenticación y obtención de contexto del usuario, detección de intención, construcción de prompt estructurado con contexto del negocio, generación de respuesta (streaming token por token o completa), y post-procesamiento con metadatos.

**Parámetros de Generación**: Temperature 0.7, Top-p 0.9, Top-k 40.

**Arquitectura de Integración**: Microservicio con servicio backend (`ChatbotService`), endpoints API REST y WebSocket, cliente frontend React, y comunicación con base de datos mediante SQLAlchemy.

## Entrenamiento y Validación

**Modelo Pre-entrenado**: Utiliza modelos LLM pre-entrenados (Phi-3 Mini, Llama 3, Mistral, Llama 3.2) que no requieren entrenamiento adicional, aprovechando su capacidad de comprensión y generación de lenguaje natural.

**Métodos de Validación**: Validación funcional (conectividad con Ollama, disponibilidad de modelos), validación de contexto (integración correcta de contexto del usuario y datos del negocio), validación de rendimiento (tiempo de respuesta < 5 segundos, streaming < 1 segundo), y validación de calidad de respuestas (relevancia, precisión, utilidad, coherencia).

**Ajustes de Hiperparámetros**: Temperature ajustada a 0.7, Top-p y Top-k configurados para controlar diversidad de respuestas.

**Criterios de Evaluación**: Relevancia al contexto del negocio, precisión basada en datos reales, utilidad orientada a la acción, coherencia con el rol del asistente, y rendimiento en tiempos razonables.

## Integración con el Sistema

**Integración Backend**: Servicio `ChatbotService` (clase singleton que gestiona comunicación con Ollama), endpoints REST (`/status`, `/models`, `/chat`, `/test`), y WebSocket para streaming (`/chat/stream`).

**Integración con Base de Datos**: Acceso mediante SQLAlchemy ORM a tablas de usuarios, cotizaciones y clientes, con consultas optimizadas para obtener contexto relevante.

**Integración Frontend**: Componente React `Chatbot.js` (interfaz de usuario con botón flotante, historial de conversación, selección de modelo, visualización de streaming) y servicio `chatbotAPI.js` (funciones para verificar estado, obtener modelos, enviar mensajes, gestión de WebSocket).

**Integración con Módulos del Negocio**: Módulo de cotizaciones (guía en creación, información sobre cotizaciones recientes), módulo de clientes (consulta y proporciona información), y módulo de usuarios (adapta respuestas según rol).

**Arquitectura de Comunicación**: Frontend React → Backend FastAPI → ChatbotService → Ollama (Local) → Respuesta Generada → Frontend React.

## Consideraciones de Ética y Sesgo

**Protección de Datos Sensibles**: Ejecución local mediante Ollama (ningún dato sale del entorno organizacional), autenticación y autorización RBAC, y filtrado de contexto (solo información relevante y autorizada).

**Mitigación de Sesgos**: Uso de modelos de código abierto (transparencia), prompt engineering cuidadoso (respuestas profesionales y orientadas al negocio), y contexto específico del dominio (enfoque en el negocio reduce sesgos generales).

**Uso Responsable**: Limitación de alcance a tareas del negocio, validación humana para acciones críticas, y transparencia (indica uso de IA y modelo utilizado).

**Monitoreo y Auditoría**: Logging de interacciones, manejo adecuado de errores, y arquitectura que permite feedback del usuario.

**Privacidad**: Sin almacenamiento permanente de conversaciones, comunicaciones seguras (HTTPS/WSS), y control total del usuario sobre la interacción.

## Beneficios Aportados al Software

**Automatización de Procesos**: Reduce esfuerzo manual para consultar información, guiar procesos y responder preguntas frecuentes mediante lenguaje natural.

**Mejora en la Toma de Decisiones**: Proporciona acceso rápido a información contextualizada del negocio (cotizaciones recientes, estadísticas de clientes, estado de procesos) para decisiones informadas.

**Optimización del Rendimiento del Sistema**: Mejora eficiencia operativa, reduce tiempo de consultas, permite interacción natural e intuitiva, y streaming para respuestas inmediatas.

**Experiencia de Usuario Personalizada**: Adapta respuestas según contexto del usuario (rol, historial, información relevante), proporcionando asistencia contextualizada.

**Reducción de Errores Humanos**: Guía paso a paso en procesos complejos, respuestas consistentes basadas en lógica del negocio, reduciendo variabilidad en ejecución.

**Escalabilidad y Mantenibilidad**: Arquitectura modular basada en estándares (REST API, WebSocket), permite cambiar modelos LLM sin modificar código principal, y diseño incremental para nuevas capacidades.

**Valor Agregado al Producto**: Posiciona al sistema como solución tecnológica de vanguardia, diferenciador frente a sistemas ERP tradicionales, asistencia inteligente 24/7 local sin costos externos, y privacidad total de datos.

**Reducción de Costos Operativos**: Automatiza consultas frecuentes, reduce carga de trabajo del personal, y ejecución local elimina costos recurrentes de servicios en la nube.

**Mejora en la Adopción del Sistema**: Interfaz conversacional natural facilita adopción por usuarios menos técnicos, reduciendo resistencia al cambio.

---

**Conclusión**: El componente de Inteligencia Artificial integrado en el sistema ERP representa una innovación significativa que combina tecnologías de vanguardia (LLM locales) con una arquitectura robusta y ética, proporcionando beneficios tangibles en automatización, eficiencia, experiencia de usuario y competitividad del producto.
