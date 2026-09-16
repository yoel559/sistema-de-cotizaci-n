from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class PaymentSchedule(Base):
    __tablename__ = "payment_schedules"

    id = Column(Integer, primary_key=True, index=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion"), nullable=False)
    installment_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False)
    amount_due = Column(Float, nullable=False)
    status = Column(String(20), default="pendiente")  # pendiente, pagado, vencido

    # Relaciones
    cotizacion = relationship("Quotation", backref="payment_schedules")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("payment_schedules.id"), nullable=False)
    paid_amount = Column(Float, nullable=False)
    paid_date = Column(Date, nullable=False)
    method = Column(String(30), nullable=True)  # efectivo, transferencia, cheque
    receipt_number = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


