from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    nombre: str
    correo: EmailStr
    contraseña: str
    rol: Optional[str] = "empleado"
    telefono: Optional[str] = None


class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[EmailStr] = None
    contraseña: Optional[str] = None
    rol: Optional[str] = None
    telefono: Optional[str] = None


class User(BaseModel):
    id_usuario: int
    nombre: str
    correo: EmailStr
    rol: str
    telefono: Optional[str] = None
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str  # correo o nombre
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
