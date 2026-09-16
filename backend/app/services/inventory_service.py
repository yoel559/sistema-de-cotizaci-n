from sqlalchemy.orm import Session
from typing import List
import os
import logging
from fastapi import HTTPException

from ..models.inventory import Vehicle, VehicleAssignment, Delivery, DeliveryPhoto
from ..schemas.inventory import (
    VehicleCreate,
    VehicleUpdate,
    VehicleAssignmentCreate,
    DeliveryCreate,
)

logger = logging.getLogger(__name__)


class InventoryService:
    @staticmethod
    def create_vehicle(db: Session, payload: VehicleCreate) -> Vehicle:
        try:
            # Crear el vehículo con todos los campos del payload
            vehicle_data = payload.dict()
            
            logger.info(f"Creando vehículo con campos: {list(vehicle_data.keys())}")
            logger.debug(f"Datos del vehículo: {vehicle_data}")
            
            # Intentar crear el vehículo
            v = Vehicle(**vehicle_data)
            db.add(v)
            db.commit()
            db.refresh(v)
            logger.info(f"Vehículo creado exitosamente con ID: {v.id}")
            return v
        except Exception as e:
            db.rollback()
            error_msg = str(e)
            logger.error(f"Error en create_vehicle: {error_msg}", exc_info=True)
            
            # Si el error es por columna desconocida (image_url), intentar sin ella
            if "no such column: image_url" in error_msg.lower() or "unknown column 'image_url'" in error_msg.lower():
                logger.warning("La columna image_url no existe, creando vehículo sin imagen...")
                vehicle_data = payload.dict()
                vehicle_data.pop('image_url', None)
                try:
                    v = Vehicle(**vehicle_data)
                    db.add(v)
                    db.commit()
                    db.refresh(v)
                    logger.info(f"Vehículo creado sin imagen con ID: {v.id}")
                    return v
                except Exception as retry_error:
                    logger.error(f"Error al reintentar sin image_url: {retry_error}", exc_info=True)
                    raise
            
            # Si es un error de integridad (VIN duplicado)
            if "unique" in error_msg.lower() or "duplicate" in error_msg.lower():
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=400,
                    detail=f"El VIN '{payload.vin}' ya existe. Debe ser único."
                )
            
            # Re-lanzar el error original
            raise
    
    @staticmethod
    def update_vehicle(db: Session, vehicle_id: int, payload: VehicleUpdate) -> Vehicle:
        """Actualizar un vehículo"""
        try:
            vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
            if not vehicle:
                raise HTTPException(status_code=404, detail="Vehículo no encontrado")
            
            # Obtener los datos del payload (solo los campos que se proporcionaron)
            try:
                update_data = payload.model_dump(exclude_none=True)
            except AttributeError:
                # Fallback para Pydantic v1
                update_data = payload.dict(exclude_none=True)
            
            logger.info(f"Actualizando vehículo {vehicle_id} con campos: {list(update_data.keys())}")
            
            # Actualizar solo los campos proporcionados
            for field, value in update_data.items():
                if hasattr(vehicle, field):
                    setattr(vehicle, field, value)
            
            db.commit()
            db.refresh(vehicle)
            logger.info(f"Vehículo {vehicle_id} actualizado exitosamente")
            return vehicle
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            error_msg = str(e)
            logger.error(f"Error actualizando vehículo {vehicle_id}: {error_msg}", exc_info=True)
            
            # Si es un error de integridad
            if "UNIQUE constraint" in error_msg or "unique constraint" in error_msg.lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"Error de integridad de datos: {error_msg}"
                )
            
            raise HTTPException(
                status_code=500,
                detail=f"Error al actualizar el vehículo: {error_msg}"
            )
    
    @staticmethod
    def update_vehicle_image(db: Session, vehicle_id: int, image_url: str) -> Vehicle:
        """Actualizar la imagen de un vehículo"""
        v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if v:
            v.image_url = image_url
        db.commit()
        db.refresh(v)
        return v

    @staticmethod
    def get_vehicle_by_id(db: Session, vehicle_id: int) -> Vehicle:
        """Obtener un vehículo por ID"""
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")
        return vehicle

    @staticmethod
    def list_vehicles(db: Session, skip: int = 0, limit: int = 100) -> List[Vehicle]:
        return db.query(Vehicle).order_by(Vehicle.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def list_deliveries(db: Session, skip: int = 0, limit: int = 100) -> List[Delivery]:
        return db.query(Delivery).order_by(Delivery.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def assign_vehicle(db: Session, payload: VehicleAssignmentCreate) -> VehicleAssignment:
        a = VehicleAssignment(**payload.dict())
        # marcar vehículo como no disponible
        v = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
        if v:
            v.available = False
        db.add(a)
        db.commit()
        db.refresh(a)
        return a

    @staticmethod
    def deliver(db: Session, payload: DeliveryCreate) -> Delivery:
        d = Delivery(**payload.dict())
        db.add(d)
        db.commit()
        db.refresh(d)
        return d

    @staticmethod
    def get_deliveries_by_quotation(db: Session, quotation_id: int) -> List[Delivery]:
        """Obtener entregas por cotización"""
        return db.query(Delivery).filter(Delivery.id_cotizacion == quotation_id).all()

    @staticmethod
    def add_delivery_photo(db: Session, delivery_id: int, filename: str, filepath: str) -> DeliveryPhoto:
        p = DeliveryPhoto(delivery_id=delivery_id, filename=filename, filepath=filepath)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        db.add(p)
        db.commit()
        db.refresh(p)
        return p


