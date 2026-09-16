from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class QuotationItem(Base):
    __tablename__ = "items_cotizacion"

    id = Column(Integer, primary_key=True, index=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion"), nullable=False)
    nombre_producto = Column(String, nullable=False)
    descripcion = Column(Text)
    cantidad = Column(Float, nullable=False)
    precio_unitario = Column(Float, nullable=False)
    precio_total = Column(Float, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    quotation = relationship("Quotation", back_populates="items")
