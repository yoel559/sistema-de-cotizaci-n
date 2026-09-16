from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ....core.database import get_db, Base, engine
from ....core.security import get_password_hash, get_current_active_user
from ....models.user import User
from ....models.quotation import Quotation, QuotationStatusHistory, QuotationStageHistory
from ....models.quotation_item import QuotationItem
from ....models.alert import Alert
from ....models.client import Client
from ....models.document import Document, DocumentType
from ....models.credit import CreditApplication, CreditApproval, Guarantee
from ....models.payment import PaymentSchedule, Payment
from ....models.inventory import Vehicle, VehicleAssignment, Delivery, DeliveryPhoto
from ....models.discarded import Discarded
from ....models.event_log import EventLog


router = APIRouter()


@router.post("/users")
async def seed_users(
    db: Session = Depends(get_db)
):
    """Crear usuarios de prueba para desarrollo"""
    users_data = [
        {
            "nombre": "Administrador",
            "correo": "admin@gmail.com",
            "contraseña": "admin123",
            "rol": "admin"
        },
        {
            "nombre": "gerente",
            "correo": "gerente@trading.com", 
            "contraseña": "gerente123",
            "rol": "gerente"
        },
        {
            "nombre": "jefe",
            "correo": "jefe@trading.com",
            "contraseña": "jefe123", 
            "rol": "jefe"
        },
        {
            "nombre": "empleado",
            "correo": "empleado@trading.com",
            "contraseña": "empleado123",
            "rol": "empleado"
        }
    ]
    
    created_users = []
    for user_data in users_data:
        # Verificar si el usuario ya existe
        existing_user = db.query(User).filter(User.correo == user_data["correo"]).first()
        if existing_user:
            continue
            
        user = User(
            nombre=user_data["nombre"],
            correo=user_data["correo"],
            contraseña=get_password_hash(user_data["contraseña"]),
            rol=user_data["rol"]
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        created_users.append(user)
    
    return {"message": f"Created {len(created_users)} users", "users": created_users}


@router.delete("/clean-all")
async def clean_all_data(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Eliminar TODOS los datos de la base de datos (excepto usuarios).
    Solo accesible para administradores.
    Requiere autenticación.
    """
    # Verificar que el usuario sea admin
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=403,
            detail="Solo los administradores pueden limpiar la base de datos"
        )
    
    try:
        deleted_counts = {}
        
        # 1. Eliminar tablas dependientes primero (historiales, documentos, etc.)
        deleted_counts["quotation_status_history"] = db.query(QuotationStatusHistory).delete()
        deleted_counts["quotation_stage_history"] = db.query(QuotationStageHistory).delete()
        deleted_counts["quotation_items"] = db.query(QuotationItem).delete()
        deleted_counts["documents"] = db.query(Document).delete()
        deleted_counts["document_types"] = db.query(DocumentType).delete()
        deleted_counts["credit_approvals"] = db.query(CreditApproval).delete()
        deleted_counts["guarantees"] = db.query(Guarantee).delete()
        deleted_counts["credit_applications"] = db.query(CreditApplication).delete()
        deleted_counts["payments"] = db.query(Payment).delete()
        deleted_counts["payment_schedules"] = db.query(PaymentSchedule).delete()
        deleted_counts["delivery_photos"] = db.query(DeliveryPhoto).delete()
        deleted_counts["deliveries"] = db.query(Delivery).delete()
        deleted_counts["vehicle_assignments"] = db.query(VehicleAssignment).delete()
        deleted_counts["vehicles"] = db.query(Vehicle).delete()
        deleted_counts["alertas"] = db.query(Alert).delete()
        deleted_counts["descartados"] = db.query(Discarded).delete()
        deleted_counts["event_logs"] = db.query(EventLog).delete()
        
        # 2. Eliminar cotizaciones
        deleted_counts["cotizaciones"] = db.query(Quotation).delete()
        
        # 3. Eliminar clientes
        deleted_counts["clientes"] = db.query(Client).delete()
        
        # 4. NO eliminar usuarios (se mantienen)
        
        db.commit()
        
        total_deleted = sum(deleted_counts.values())
        
        return {
            "message": "Base de datos limpiada exitosamente",
            "deleted_counts": deleted_counts,
            "total_records_deleted": total_deleted,
            "note": "Los usuarios no fueron eliminados"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al limpiar la base de datos: {str(e)}"
        )


@router.delete("/clean-all-including-users")
async def clean_all_including_users(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Eliminar TODOS los datos de la base de datos INCLUYENDO usuarios.
    Muy peligroso - solo accesible para administradores.
    Requiere autenticación.
    """
    # Verificar que el usuario sea admin
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=403,
            detail="Solo los administradores pueden limpiar la base de datos"
        )
    
    try:
        deleted_counts = {}
        
        # 1. Eliminar tablas dependientes primero
        deleted_counts["quotation_status_history"] = db.query(QuotationStatusHistory).delete()
        deleted_counts["quotation_stage_history"] = db.query(QuotationStageHistory).delete()
        deleted_counts["quotation_items"] = db.query(QuotationItem).delete()
        deleted_counts["documents"] = db.query(Document).delete()
        deleted_counts["document_types"] = db.query(DocumentType).delete()
        deleted_counts["credit_approvals"] = db.query(CreditApproval).delete()
        deleted_counts["guarantees"] = db.query(Guarantee).delete()
        deleted_counts["credit_applications"] = db.query(CreditApplication).delete()
        deleted_counts["payments"] = db.query(Payment).delete()
        deleted_counts["payment_schedules"] = db.query(PaymentSchedule).delete()
        deleted_counts["delivery_photos"] = db.query(DeliveryPhoto).delete()
        deleted_counts["deliveries"] = db.query(Delivery).delete()
        deleted_counts["vehicle_assignments"] = db.query(VehicleAssignment).delete()
        deleted_counts["vehicles"] = db.query(Vehicle).delete()
        deleted_counts["alertas"] = db.query(Alert).delete()
        deleted_counts["descartados"] = db.query(Discarded).delete()
        deleted_counts["event_logs"] = db.query(EventLog).delete()
        
        # 2. Eliminar cotizaciones
        deleted_counts["cotizaciones"] = db.query(Quotation).delete()
        
        # 3. Eliminar clientes
        deleted_counts["clientes"] = db.query(Client).delete()
        
        # 4. Eliminar usuarios (INCLUYENDO el usuario actual)
        deleted_counts["usuarios"] = db.query(User).delete()
        
        db.commit()
        
        total_deleted = sum(deleted_counts.values())
        
        return {
            "message": "Base de datos completamente limpiada (incluyendo usuarios)",
            "deleted_counts": deleted_counts,
            "total_records_deleted": total_deleted,
            "warning": "Todos los usuarios fueron eliminados. Necesitarás crear nuevos usuarios."
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al limpiar la base de datos: {str(e)}"
        )


