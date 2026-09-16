from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base


class Discarded(Base):
    __tablename__ = "descartados"

    id_descartado = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    motivo = Column(String(255), nullable=True)
    fecha_descartado = Column(Date, nullable=False)

    cliente = relationship("Client")


