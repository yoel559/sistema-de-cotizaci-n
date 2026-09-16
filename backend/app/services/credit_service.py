from sqlalchemy.orm import Session
from typing import List, Optional

from ..models.credit import CreditApplication, CreditApproval, Guarantee
from ..schemas.credit import (
    CreditApplicationCreate,
    CreditApprovalCreate,
    GuaranteeCreate,
)


class CreditService:
    @staticmethod
    def create_application(db: Session, payload: CreditApplicationCreate) -> CreditApplication:
        app = CreditApplication(
            id_cotizacion=payload.id_cotizacion,
            requested_amount=payload.requested_amount,
            term_months=payload.term_months,
            status="pendiente",
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def approve_application(db: Session, payload: CreditApprovalCreate) -> CreditApproval:
        app = db.query(CreditApplication).filter(CreditApplication.id == payload.application_id).first()
        if not app:
            raise ValueError("Application not found")
        approval = CreditApproval(**payload.dict())
        app.status = "aprobado"
        app.approved_amount = payload.approved_amount
        app.term_months = payload.term_months
        db.add(approval)
        db.commit()
        db.refresh(approval)
        return approval

    @staticmethod
    def add_guarantee(db: Session, payload: GuaranteeCreate) -> Guarantee:
        g = Guarantee(**payload.dict())
        db.add(g)
        db.commit()
        db.refresh(g)
        return g

    @staticmethod
    def get_applications(db: Session, skip: int = 0, limit: int = 100) -> List[CreditApplication]:
        """Obtener lista de aplicaciones de crédito con paginación"""
        return db.query(CreditApplication).offset(skip).limit(limit).all()

    @staticmethod
    def get_application(db: Session, app_id: int) -> Optional[CreditApplication]:
        return db.query(CreditApplication).filter(CreditApplication.id == app_id).first()

    @staticmethod
    def list_by_quotation(db: Session, quotation_id: int) -> List[CreditApplication]:
        return db.query(CreditApplication).filter(CreditApplication.id_cotizacion == quotation_id).all()


