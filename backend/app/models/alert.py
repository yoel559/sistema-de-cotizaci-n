from sqlalchemy import Column, Integer, Date, ForeignKey, Enum, String
from sqlalchemy.orm import relationship
from ..core.database import Base


class Alert(Base):
    __tablename__ = "alertas"

    # Esquema de producción (minimalista)
    id_alerta = Column(Integer, primary_key=True, index=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion"), nullable=False)
    fecha_alerta = Column(Date, nullable=False)
    estado_alerta = Column(Enum("pendiente", "enviado", "atendido", name="estado_alerta"), default="pendiente")
    message = Column(String, nullable=True)

    # Relaciones
    cotizacion = relationship("Quotation")
