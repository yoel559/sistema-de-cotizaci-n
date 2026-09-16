from fastapi import FastAPI, Depends, Request, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import uvicorn
from fastapi.responses import JSONResponse
import logging, traceback
import os

from .core.config import settings
from .core.database import engine, Base
from .api.v1.api import api_router
# Import all models to ensure they are registered before creating tables
from .models import *
from .websockets.manager import websocket_manager
from .scheduler.scheduler import start_scheduler, stop_scheduler
from sqlalchemy import inspect, text


logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación"""
    # Inicializar componentes
    print("Iniciando FastAPI Trading System...")

    # Crear tablas de la base de datos
    Base.metadata.create_all(bind=engine)
    
    # Verificar y agregar columnas si no existen (para SQLite)
    if settings.database_url.startswith("sqlite"):
        try:
            inspector = inspect(engine)
            if 'vehicles' in inspector.get_table_names():
                columns = [col['name'] for col in inspector.get_columns('vehicles')]
                
                # Agregar columna image_url si no existe
                if 'image_url' not in columns:
                    logger.info("Agregando columna image_url a la tabla vehicles...")
                    with engine.connect() as conn:
                        conn.execute(text("ALTER TABLE vehicles ADD COLUMN image_url VARCHAR(500)"))
                        conn.commit()
                    logger.info("Columna image_url agregada exitosamente")
                
                # Agregar columna precio si no existe
                if 'precio' not in columns:
                    logger.info("Agregando columna precio a la tabla vehicles...")
                    with engine.connect() as conn:
                        conn.execute(text("ALTER TABLE vehicles ADD COLUMN precio NUMERIC(10, 2)"))
                        conn.commit()
                    logger.info("Columna precio agregada exitosamente")
            
            # Verificar y agregar columna tipo_pago a cotizaciones si no existe
            if 'cotizaciones' in inspector.get_table_names():
                quotation_columns = [col['name'] for col in inspector.get_columns('cotizaciones')]
                
                # Agregar columna tipo_pago si no existe
                if 'tipo_pago' not in quotation_columns:
                    logger.info("Agregando columna tipo_pago a la tabla cotizaciones...")
                    with engine.connect() as conn:
                        conn.execute(text("ALTER TABLE cotizaciones ADD COLUMN tipo_pago VARCHAR(20) DEFAULT 'contado'"))
                        conn.commit()
                    logger.info("Columna tipo_pago agregada exitosamente")
            
            # Verificar y agregar columna telefono a usuarios si no existe
            if 'usuarios' in inspector.get_table_names():
                user_columns = [col['name'] for col in inspector.get_columns('usuarios')]
                
                # Agregar columna telefono si no existe
                if 'telefono' not in user_columns:
                    logger.info("Agregando columna telefono a la tabla usuarios...")
                    with engine.connect() as conn:
                        conn.execute(text("ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20)"))
                        conn.commit()
                    logger.info("Columna telefono agregada exitosamente")
        except Exception as e:
            logger.warning(f"No se pudieron agregar las columnas (pueden que ya existan): {e}")

    # Iniciar scheduler (condicional)
    if settings.enable_scheduler:
        start_scheduler()

    yield

    # Limpiar recursos
    print("Deteniendo FastAPI Trading System...")
    if settings.enable_scheduler:
        stop_scheduler()


# Crear la aplicación FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Sistema de Trading con FastAPI y PostgreSQL",
    lifespan=lifespan
)

# Configurar CORS (incluye WebSockets)
# IMPORTANTE: El orden del middleware es importante, CORS debe ir ANTES de todo
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos
    allow_headers=["*"],  # Permitir todos los headers
    expose_headers=["*"],
    max_age=3600,
)

# Configurar Trusted Hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # En producción, especificar hosts específicos
)

# Incluir rutas de la API
app.include_router(api_router, prefix="/api/v1")

# Servir archivos estáticos del frontend (si existe el directorio static)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

# Ruta de salud
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version
    }

# Ruta raíz
@app.get("/")
async def root():
    return {
        "message": "FastAPI Trading System",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health"
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Maneja excepciones HTTP y asegura que los headers CORS estén presentes."""
    origin = request.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:3001", "http://127.0.0.1:3001"
    ]
    
    if origin and origin in allowed_origins:
        allow_origin = origin
    else:
        allow_origin = allowed_origins[2]  # http://localhost:3001
    
    headers = dict(exc.headers) if exc.headers else {}
    headers.update({
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    })
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log completo en consola/uvicorn
    logger.error("Unhandled exception during request %s %s", request.method, request.url, exc_info=exc)
    # En dev, devolver detalle para depuración
    origin = request.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:3001", "http://127.0.0.1:3001"
    ]
    
    # Determinar el origen permitido
    if origin and origin in allowed_origins:
        allow_origin = origin
    else:
        # Si no hay origin o no está permitido, usar el primero por defecto
        allow_origin = allowed_origins[2]  # http://localhost:3001
    
    error_detail = str(exc)
    error_traceback = traceback.format_exc().splitlines()[-10:] if settings.debug else []
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "error": error_detail,
            "traceback": error_traceback,
            "path": str(request.url),
            "method": request.method
        },
        headers={
            "Access-Control-Allow-Origin": allow_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Expose-Headers": "*",
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        workers=settings.workers if not settings.debug else 1
    )