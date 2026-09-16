from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class User(Base):
    __tablename__ = "usuarios"

    # Esquema de producción
    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(100), unique=True, index=True, nullable=False)
    contraseña = Column(String(255), nullable=False)  # almacenar hash
    rol = Column(String(50), default="empleado")
    telefono = Column(String(20), nullable=True)  # Número de teléfono opcional
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    manager_id = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)

    # Relaciones (comentadas temporalmente para evitar problemas de importación circular)
    cotizaciones = relationship("Quotation", back_populates="usuario", cascade="save-update, merge", passive_deletes=True)
