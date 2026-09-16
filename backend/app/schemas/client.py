from pydantic import BaseModel, field_serializer
from typing import Optional
from datetime import datetime


class ClientCreate(BaseModel):
    nombre: str
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    preferencias: Optional[str] = None


class ClientUpdate(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    preferencias: Optional[str] = None


class Client(BaseModel):
    id_cliente: int
    nombre: str
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    preferencias: Optional[str] = None
    fecha_registro: Optional[datetime] = None

    @field_serializer('fecha_registro')
    def serialize_fecha_registro(self, value: Optional[datetime], _info):
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.isoformat()
        return value

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
