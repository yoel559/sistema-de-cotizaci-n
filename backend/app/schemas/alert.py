from pydantic import BaseModel
from typing import Optional
from datetime import date


class AlertCreate(BaseModel):
    id_cotizacion: int
    fecha_alerta: date
    estado_alerta: Optional[str] = "pendiente"  # pendiente | enviado | atendido
    message: Optional[str] = None


class Alert(BaseModel):
    id_alerta: int
    id_cotizacion: int
    fecha_alerta: date
    estado_alerta: str
    message: Optional[str] = None

    class Config:
        from_attributes = True
