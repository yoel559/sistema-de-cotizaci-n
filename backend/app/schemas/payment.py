from pydantic import BaseModel
from typing import Optional, List
from datetime import date, timedelta
from .quotation import ClientBasic


class PaymentScheduleBase(BaseModel):
    id_cotizacion: int
    installment_number: int
    due_date: date
    amount_due: float


class PaymentScheduleCreate(PaymentScheduleBase):
    pass


class PaymentScheduleWithTypeCreate(BaseModel):
    """Crear cronograma con tipo de pago (contado o financiado)"""
    id_cotizacion: int
    monto_total: float
    tipo_pago: str  # "contado" o "financiado"
    fecha_inicio: Optional[date] = None  # Si no se proporciona, usa fecha actual
    dias_vencimiento_financiado: Optional[int] = 30  # Días para el segundo pago si es financiado


class QuotationBasic(BaseModel):
    """Schema básico de cotización para incluir en PaymentSchedule"""
    id_cotizacion: int
    numero_cotizacion: str
    vehiculo: str
    cliente: Optional[ClientBasic] = None
    
    class Config:
        from_attributes = True


class PaymentSchedule(PaymentScheduleBase):
    id: int
    status: str
    cotizacion: Optional[QuotationBasic] = None
    
    class Config:
        from_attributes = True


class PaymentBase(BaseModel):
    schedule_id: int
    paid_amount: float
    paid_date: date
    method: Optional[str] = None
    receipt_number: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class Payment(PaymentBase):
    id: int
    class Config:
        from_attributes = True


