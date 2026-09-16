from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Client(Base):
    __tablename__ = "clientes"

    # Esquema de producción
    id_cliente = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=True)
    telefono = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    preferencias = Column(String(255), nullable=True)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones (lazy="noload" para evitar cargar automáticamente y causar errores de serialización)
    cotizaciones = relationship("Quotation", back_populates="cliente", lazy="noload")
