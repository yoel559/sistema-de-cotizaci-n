from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.security import get_current_active_user
from ....schemas.user import UserCreate, UserUpdate, User as UserSchema
from ....services.user_service import UserService

router = APIRouter()


@router.post("/", response_model=UserSchema)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Crear nuevo usuario (solo admin)"""
    if not UserService.is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Verificar si el usuario ya existe
    db_user = UserService.get_user_by_nombre(db, nombre=user.nombre)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    db_user = UserService.get_user_by_correo(db, correo=user.correo)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    return UserService.create_user(db=db, user=user)


@router.get("/", response_model=List[UserSchema])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Obtener lista de usuarios (solo admin)"""
    if not UserService.is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return UserService.get_users(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserSchema)
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Obtener usuario por ID"""
    if not UserService.is_admin(current_user) and current_user.id_usuario != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_user = UserService.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Actualizar usuario"""
    if not UserService.is_admin(current_user) and current_user.id_usuario != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_user = UserService.update_user(db, user_id=user_id, user_update=user_update)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Eliminar usuario (soft delete)"""
    if not UserService.is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # No se implementa borrado físico
    raise HTTPException(status_code=400, detail="Delete no soportado")
