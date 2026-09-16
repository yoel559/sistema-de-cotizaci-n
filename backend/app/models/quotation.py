from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from ..core.database import Base


class EstadoCotizacionEnum(str, Enum):
    FRIO = "frio"
    TIBIO = "tibio"
    CALIENTE = "caliente"


class TipoPagoEnum(str, Enum):
    FINANCIADO = "financiado"
    CONTADO = "contado"


class Quotation(Base):
    __tablename__ = "cotizaciones"

    # Esquema de producción
    id_cotizacion = Column(Integer, primary_key=True, index=True)
    numero_cotizacion = Column(String(20), unique=True, nullable=False)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    vehiculo = Column(String(100), nullable=False)
    estado = Column(Enum("frio", "tibio", "caliente", name="estado_cotizacion"), nullable=False)
    fecha_registro = Column(Date, nullable=False)
    fecha_seguimiento = Column(Date, nullable=False)
    tipo_pago = Column(Enum("financiado", "contado", name="tipo_pago"), nullable=True, default="contado")

    # Etapa del workflow de negocio (simplificada)
    stage = Column(String(40), default="prospecto")  # prospecto -> orden_compra -> contrato -> asignacion -> entrega -> posventa

    # Relaciones
    cliente = relationship("Client", back_populates="cotizaciones")
    usuario = relationship("User", back_populates="cotizaciones")
    items = relationship("QuotationItem", back_populates="quotation")


from sqlalchemy import DateTime
from sqlalchemy.sql import func


class QuotationStatusHistory(Base):
    __tablename__ = "quotation_status_history"

    id = Column(Integer, primary_key=True, index=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion"), nullable=False)
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    changed_by = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class QuotationStageHistory(Base):
    __tablename__ = "quotation_stage_history"

    id = Column(Integer, primary_key=True, index=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion"), nullable=False)
    old_stage = Column(String(40), nullable=True)
    new_stage = Column(String(40), nullable=False)
    changed_by = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())