from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.sql import func

from ..core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String(50), unique=True, nullable=False)
    marca = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    color = Column(String(50), nullable=True)
    available = Column(Boolean, default=True)
    image_url = Column(String(500), nullable=True)  # URL o ruta de la imagen
    precio = Column(Numeric(10, 2), nullable=True)  # Precio del vehículo
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VehicleAssignment(Base):
    __tablename__ = "vehicle_assignments"

    id = Column(Integer, primary_key=True, index=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    released_at = Column(DateTime(timezone=True), nullable=True)


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    delivered_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(255), nullable=True)


class DeliveryPhoto(Base):
    __tablename__ = "delivery_photos"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


