from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class DocumentType(Base):
    __tablename__ = "document_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(255), nullable=True)
    required_in_stage = Column(String(50), nullable=True)  # etapa del workflow donde es requerido
    active = Column(Boolean, default=True)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion"), nullable=False)
    document_type_id = Column(Integer, ForeignKey("document_types.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    mimetype = Column(String(100), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(30), default="pendiente")  # pendiente, revisado, observado
    note = Column(String(255), nullable=True)


