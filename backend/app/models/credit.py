from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey
from sqlalchemy.sql import func

from ..core.database import Base


class CreditApplication(Base):
    __tablename__ = "credit_applications"

    id = Column(Integer, primary_key=True, index=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion"), nullable=False)
    status = Column(String(30), default="pendiente")  # pendiente, aprobado, rechazado, observado
    requested_amount = Column(Float, nullable=True)
    approved_amount = Column(Float, nullable=True)
    term_months = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


class CreditApproval(Base):
    __tablename__ = "credit_approvals"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("credit_applications.id"), nullable=False)
    approved_amount = Column(Float, nullable=False)
    term_months = Column(Integer, nullable=False)
    letter_number = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Guarantee(Base):
    __tablename__ = "guarantees"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("credit_applications.id"), nullable=False)
    type = Column(String(50), nullable=False)  # p.ej. prenda, hipoteca
    description = Column(String(255), nullable=True)
    value = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


