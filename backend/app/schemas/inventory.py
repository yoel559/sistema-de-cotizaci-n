from pydantic import BaseModel, field_serializer
from typing import Optional
from decimal import Decimal
from datetime import datetime


class VehicleBase(BaseModel):
    vin: str
    marca: str
    model: str
    color: Optional[str] = None
    available: Optional[bool] = True
    image_url: Optional[str] = None
    precio: Optional[Decimal] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    """Schema para actualizar vehículo - todos los campos son opcionales"""
    marca: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    available: Optional[bool] = None
    image_url: Optional[str] = None
    precio: Optional[Decimal] = None


class Vehicle(VehicleBase):
    id: int
    created_at: Optional[datetime] = None

    @field_serializer('created_at')
    def serialize_created_at(self, value: Optional[datetime], _info):
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.isoformat()
        return value

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class VehicleAssignmentBase(BaseModel):
    id_cotizacion: int
    vehicle_id: int


class VehicleAssignmentCreate(VehicleAssignmentBase):
    pass


class VehicleAssignment(VehicleAssignmentBase):
    id: int
    class Config:
        from_attributes = True


class DeliveryBase(BaseModel):
    id_cotizacion: int
    vehicle_id: int
    notes: Optional[str] = None


class DeliveryCreate(DeliveryBase):
    pass


class Delivery(DeliveryBase):
    id: int
    class Config:
        from_attributes = True


class DeliveryPhotoBase(BaseModel):
    delivery_id: int
    filename: str
    filepath: str


class DeliveryPhotoCreate(DeliveryPhotoBase):
    pass


class DeliveryPhoto(DeliveryPhotoBase):
    id: int
    class Config:
        from_attributes = True


