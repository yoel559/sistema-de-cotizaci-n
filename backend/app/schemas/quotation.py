from pydantic import BaseModel
from typing import Optional
from datetime import date


class QuotationCreate(BaseModel):
    id_cliente: int
    id_usuario: int
    vehiculo: str
    estado: str  # 'frio' | 'tibio' | 'caliente'
    fecha_registro: date
    fecha_seguimiento: date
    tipo_pago: Optional[str] = "contado"  # 'financiado' | 'contado'


class QuotationUpdate(BaseModel):
    vehiculo: Optional[str] = None
    estado: Optional[str] = None
    fecha_registro: Optional[date] = None
    fecha_seguimiento: Optional[date] = None
    tipo_pago: Optional[str] = None


class ClientBasic(BaseModel):
    id_cliente: int
    nombre: str
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    preferencias: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserBasic(BaseModel):
    id_usuario: int
    nombre: str
    correo: str
    
    class Config:
        from_attributes = True


class Quotation(BaseModel):
    id_cotizacion: int
    numero_cotizacion: str
    id_cliente: int
    id_usuario: int
    vehiculo: str
    estado: str
    fecha_registro: date
    fecha_seguimiento: date
    tipo_pago: Optional[str] = None
    stage: str
    cliente: Optional[ClientBasic] = None
    usuario: Optional[UserBasic] = None

    class Config:
        from_attributes = True
