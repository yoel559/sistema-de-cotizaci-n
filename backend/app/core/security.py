from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .config import settings
from ..models.user import User
from ..core.database import get_db

# AutenticaciÃ³n por portador
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    if password is None:
        raise ValueError("Password cannot be None")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(credentials.credentials)
    if payload is None:
        raise cred_exc

    subject: str = payload.get("sub")  # usaremos correo como subject
    if subject is None:
        raise cred_exc

    user = db.query(User).filter(User.correo == subject).first()
    if user is None:
        raise cred_exc
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    # No hay bandera de activo en el esquema actual; devolver usuario.
    return current_user


def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
    """Autenticar por correo (preferido) o nombre."""
    try:
        user = (
            db.query(User)
            .filter((User.correo == identifier) | (User.nombre == identifier))
            .first()
        )
        if not user:
            return None

        password_hash = getattr(user, "contraseÃ±a", None)
        if password_hash is None:
            password_hash = getattr(user, "contrase\u00f1a", None)

        if not password_hash:
            return None

        if not verify_password(password, password_hash):
            return None
        return user
    except Exception as e:
        # Log del error para debugging
        import logging
        logger = logging.getLogger("uvicorn.error")
        logger.error(f"Error en authenticate_user: {str(e)}", exc_info=True)
        return None
