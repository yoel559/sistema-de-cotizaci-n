from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from ..models.user import User
from ..schemas.user import UserCreate, UserUpdate
from ..core.security import get_password_hash, verify_password


class UserService:
    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """Crear un nuevo usuario (campos en español)"""
        hashed_password = get_password_hash(user.contraseña)
        db_user = User(
            nombre=user.nombre,
            correo=user.correo,
            contraseña=hashed_password,
            rol=user.rol or "empleado",
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id_usuario == user_id).first()

    @staticmethod
    def get_user_by_nombre(db: Session, nombre: str) -> Optional[User]:
        return db.query(User).filter(User.nombre == nombre).first()

    @staticmethod
    def get_user_by_correo(db: Session, correo: str) -> Optional[User]:
        return db.query(User).filter(User.correo == correo).first()

    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        db_user = UserService.get_user_by_id(db, user_id)
        if not db_user:
            return None

        update_data = user_update.dict(exclude_unset=True)
        if "contraseña" in update_data and update_data["contraseña"]:
            update_data["contraseña"] = get_password_hash(update_data["contraseña"])

        for field, value in update_data.items():
            setattr(db_user, field, value)

        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        # No hay flag activo; si necesitas borrado lógico, agrega columna. Por ahora, eliminar físico no deseado.
        return False

    @staticmethod
    def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
        user = (
            db.query(User)
            .filter((User.correo == identifier) | (User.nombre == identifier))
            .first()
        )
        if not user:
            return None
        if not verify_password(password, user.contraseña):
            return None
        return user

    @staticmethod
    def is_admin(user: User) -> bool:
        return (user.rol or "").lower() == "admin"
