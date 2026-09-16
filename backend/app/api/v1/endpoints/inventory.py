from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
import logging
from pathlib import Path

from ....core.database import get_db
from ....core.security import get_current_active_user
from ....schemas.inventory import (
    VehicleCreate,
    VehicleUpdate,
    Vehicle,
    VehicleAssignmentCreate,
    VehicleAssignment,
    DeliveryCreate,
    Delivery,
)
from ....services.inventory_service import InventoryService

logger = logging.getLogger(__name__)

router = APIRouter()

# Directorio para almacenar imágenes de vehículos
VEHICLES_IMAGE_DIR = Path("storage/vehicles")
VEHICLES_IMAGE_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(
    vin: str = Form(...),
    marca: str = Form(...),
    model: str = Form(...),
    color: Optional[str] = Form(None),
    available: str = Form("true"),
    precio: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Crear un vehículo con opción de subir imagen"""
    try:
        logger.info(f"Recibiendo solicitud para crear vehículo: VIN={vin}, Marca={marca}, Model={model}, Color={color}, Available={available}")
        logger.info(f"Imagen recibida: {image.filename if image else 'None'}")
        image_url = None
        
        # Si se subió una imagen, guardarla
        if image and image.filename:
            try:
                # Validar que sea una imagen
                allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
                file_ext = Path(image.filename).suffix.lower()
                
                if file_ext not in allowed_extensions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Tipo de archivo no permitido. Solo se permiten: {', '.join(allowed_extensions)}"
                    )
                
                # Generar nombre único para el archivo
                file_id = str(uuid.uuid4())
                filename = f"{file_id}{file_ext}"
                filepath = VEHICLES_IMAGE_DIR / filename
                
                # Asegurar que el directorio existe
                VEHICLES_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
                
                # Guardar el archivo
                content = await image.read()
                with open(filepath, "wb") as f:
                    f.write(content)
                
                # Guardar la ruta relativa o URL
                image_url = f"/api/v1/inventory/vehicles/images/{filename}"
                logger.info(f"Imagen guardada: {filepath}")
            except Exception as e:
                logger.error(f"Error guardando imagen: {e}", exc_info=True)
                raise HTTPException(
                    status_code=500,
                    detail=f"Error al guardar la imagen: {str(e)}"
                )
        
        # Convertir available de string a boolean
        available_bool = available.lower() == 'true' if isinstance(available, str) else bool(available)
        
        # Convertir precio de string a Decimal si se proporciona
        from decimal import Decimal, InvalidOperation
        precio_decimal = None
        if precio and precio.strip():
            try:
                precio_decimal = Decimal(precio.strip())
            except (InvalidOperation, ValueError):
                raise HTTPException(
                    status_code=400,
                    detail="El precio debe ser un número válido"
                )
        
        # Crear el payload
        try:
            payload_data = {
                "vin": vin.strip() if vin else "",
                "marca": marca.strip() if marca else "",
                "model": model.strip() if model else "",
                "color": color.strip() if color and color.strip() else None,
                "available": available_bool,
                "image_url": image_url,
                "precio": precio_decimal
            }
            logger.info(f"Payload data: {payload_data}")
            payload = VehicleCreate(**payload_data)
            logger.info(f"Payload creado exitosamente: {payload}")
        except Exception as validation_error:
            logger.error(f"Error validando payload: {validation_error}", exc_info=True)
            raise HTTPException(
                status_code=400,
                detail=f"Error de validación: {str(validation_error)}"
            )
        
        logger.info(f"Creando vehículo: VIN={vin}, Marca={marca}, Model={model}, Available={available_bool}")
        
        try:
            vehicle = InventoryService.create_vehicle(db, payload)
            logger.info(f"Vehículo creado exitosamente: ID={vehicle.id}")
            return vehicle
        except Exception as e:
            logger.error(f"Error creando vehículo en la base de datos: {e}", exc_info=True)
            # Si hay un error de integridad (VIN duplicado), dar mensaje específico
            if "unique" in str(e).lower() or "duplicate" in str(e).lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"El VIN '{vin}' ya existe. Debe ser único."
                )
            raise HTTPException(
                status_code=500,
                detail=f"Error al crear el vehículo: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado al crear vehículo: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )


@router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
@router.patch("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(
    vehicle_id: int,
    marca: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    available: Optional[str] = Form(None),
    precio: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Actualizar un vehículo"""
    try:
        logger.info(f"Actualizando vehículo {vehicle_id}")
        
        image_url = None
        
        # Si se subió una nueva imagen, guardarla
        if image and image.filename:
            try:
                allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
                file_ext = Path(image.filename).suffix.lower()
                
                if file_ext not in allowed_extensions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Tipo de archivo no permitido. Solo se permiten: {', '.join(allowed_extensions)}"
                    )
                
                file_id = str(uuid.uuid4())
                filename = f"{file_id}{file_ext}"
                filepath = VEHICLES_IMAGE_DIR / filename
                
                VEHICLES_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
                
                content = await image.read()
                with open(filepath, "wb") as f:
                    f.write(content)
                
                image_url = f"/api/v1/inventory/vehicles/images/{filename}"
                logger.info(f"Imagen guardada: {filepath}")
            except Exception as e:
                logger.error(f"Error guardando imagen: {e}", exc_info=True)
                raise HTTPException(
                    status_code=500,
                    detail=f"Error al guardar la imagen: {str(e)}"
                )
        
        # Convertir available de string a boolean si se proporciona
        available_bool = None
        if available is not None:
            available_bool = available.lower() == 'true' if isinstance(available, str) else bool(available)
        
        # Convertir precio de string a Decimal si se proporciona
        from decimal import Decimal, InvalidOperation
        precio_decimal = None
        if precio and precio.strip():
            try:
                precio_decimal = Decimal(precio.strip())
            except (InvalidOperation, ValueError):
                raise HTTPException(
                    status_code=400,
                    detail="El precio debe ser un número válido"
                )
        
        # Crear el payload de actualización
        update_data = {}
        if marca is not None:
            update_data["marca"] = marca.strip() if marca else None
        if model is not None:
            update_data["model"] = model.strip() if model else None
        if color is not None:
            update_data["color"] = color.strip() if color and color.strip() else None
        if available_bool is not None:
            update_data["available"] = available_bool
        if precio_decimal is not None:
            update_data["precio"] = precio_decimal
        if image_url is not None:
            update_data["image_url"] = image_url
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No se proporcionaron campos para actualizar"
            )
        
        payload = VehicleUpdate(**update_data)
        logger.info(f"Payload de actualización: {update_data}")
        
        vehicle = InventoryService.update_vehicle(db, vehicle_id, payload)
        logger.info(f"Vehículo {vehicle_id} actualizado exitosamente")
        return vehicle
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado al actualizar vehículo: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )


@router.get("/vehicles/images/{filename}")
async def get_vehicle_image(filename: str):
    """Servir imágenes de vehículos"""
    filepath = VEHICLES_IMAGE_DIR / filename
    if not filepath.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    return FileResponse(filepath)


@router.get("/vehicles", response_model=List[Vehicle])
async def list_vehicles(
    skip: int = Query(0, description="Número de registros a omitir"),
    limit: int = Query(100, description="Número máximo de registros a devolver"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    try:
        user_email = getattr(current_user, 'correo', 'Unknown') if current_user else 'None'
        logger.info(f"Listando vehículos - skip: {skip}, limit: {limit}, user: {user_email}")
        
        vehicles = InventoryService.list_vehicles(db, skip=skip, limit=limit)
        logger.info(f"Vehículos obtenidos de BD: {len(vehicles)}")
        return vehicles
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en list_vehicles: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error al obtener vehículos: {str(e)}")


@router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Obtener un vehículo por ID"""
    logger.info(f"Solicitando vehículo con ID: {vehicle_id}")
    try:
        vehicle = InventoryService.get_vehicle_by_id(db, vehicle_id)
        logger.info(f"Vehículo encontrado: {vehicle.id}")
        return vehicle
    except Exception as e:
        logger.error(f"Error obteniendo vehículo {vehicle_id}: {e}", exc_info=True)
        raise


@router.post("/assignments", response_model=VehicleAssignment)
async def assign_vehicle(
    payload: VehicleAssignmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return InventoryService.assign_vehicle(db, payload)


@router.get("/deliveries", response_model=List[Delivery])
async def list_deliveries(
    skip: int = Query(0, description="Número de registros a omitir"),
    limit: int = Query(100, description="Número máximo de registros a devolver"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return InventoryService.list_deliveries(db, skip=skip, limit=limit)


@router.post("/deliveries", response_model=Delivery)
async def create_delivery(
    payload: DeliveryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return InventoryService.deliver(db, payload)


@router.get("/quotation/{quotation_id}", response_model=List[Delivery])
async def get_deliveries_by_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Obtener entregas por cotización"""
    return InventoryService.get_deliveries_by_quotation(db, quotation_id)


@router.post("/deliveries/{delivery_id}/photos")
async def upload_delivery_photo(
    delivery_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    folder = os.path.join("storage", "deliveries", str(delivery_id))
    os.makedirs(folder, exist_ok=True)
    filepath = os.path.join(folder, file.filename)
    with open(filepath, "wb") as f:
        f.write(await file.read())
    return InventoryService.add_delivery_photo(db, delivery_id, file.filename, filepath)


