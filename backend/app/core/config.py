from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

# Obtener la ruta base del proyecto (portable)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
PORTABLE_MODE = os.path.exists(BASE_DIR / "PORTABLE_MODE.txt")


class Settings(BaseSettings):
    # Configuración de la aplicación
    app_name: str = "Trebol Servicios Empresariales"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Configuración de la base de datos (portable)
    database_url: str = "sqlite:///./data/trading_system.db" if PORTABLE_MODE else "sqlite:///./dev.db"
    redis_url: str = "redis://localhost:6379"
    
    # Configuración de seguridad
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Scheduler / Tareas programadas
    enable_scheduler: bool = False
    
    # Configuración de notificaciones
    sendgrid_api_key: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    firebase_credentials_path: Optional[str] = None
    
    # Configuración de Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    
    # Configuración del servidor
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    
    # Configuración de Ollama (portable)
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "phi3:mini"
    ollama_models_path: Optional[str] = None  # Ruta local para modelos
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignorar campos extra en .env que no estén definidos

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Si está en modo portable, ajustar rutas
        if PORTABLE_MODE:
            # Asegurar que la base de datos esté en una carpeta portable
            db_path = BASE_DIR / "data"
            db_path.mkdir(exist_ok=True)
            self.database_url = f"sqlite:///{db_path / 'trading_system.db'}"
            
            # Configurar ruta de modelos de Ollama si existe
            ollama_models_dir = BASE_DIR / "ollama_models"
            if ollama_models_dir.exists():
                self.ollama_models_path = str(ollama_models_dir)


# Instancia global de configuración
settings = Settings()
