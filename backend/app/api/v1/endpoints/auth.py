from datetime import timedelta
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.security import create_access_token, authenticate_user, get_current_active_user
from ....schemas.user import UserLogin, Token, User
from ....services.user_service import UserService
from ....schemas.user import UserCreate

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

@router.post("/signup", response_model=User)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Registro público de usuario (correo, nombre, contraseña)."""
    # Validaciones básicas
    if UserService.get_user_by_correo(db, user.correo):
        raise HTTPException(status_code=400, detail="Correo ya registrado")
    created = UserService.create_user(db, user)
    return created


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login de usuario (correo o nombre en `username`)."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # No hay bandera de activo en el esquema actual
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.correo}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login-form", response_model=Token)
async def login_form(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login de usuario con formulario personalizado (username = correo o nombre)."""
    try:
        # Debug: log de las credenciales recibidas
        logger.info(f"Login attempt - username: {user_credentials.username}, password length: {len(user_credentials.password) if user_credentials.password else 0}")

        # Validar que se recibieron las credenciales
        if not user_credentials.username or not user_credentials.password:
            logger.warning("Missing username or password")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username and password are required"
            )

        user = authenticate_user(db, user_credentials.username, user_credentials.password)
        if not user:
            logger.warning(f"Authentication failed for username: {user_credentials.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        logger.info(f"Login successful for user: {user.correo}")
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.correo}, expires_delta=access_token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en login-form: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )


@router.get("/me", response_model=User)
async def read_users_me(
    current_user = Depends(get_current_active_user)
):
    """Obtener información del usuario actual con alias compatibles."""
    return {
        "id_usuario": current_user.id_usuario,
        "id": current_user.id_usuario,
        "nombre": current_user.nombre,
        "correo": current_user.correo,
        "rol": current_user.rol,
        "role": current_user.rol,
        "fecha_creacion": current_user.fecha_creacion,
    }

