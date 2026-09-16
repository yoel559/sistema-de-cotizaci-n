from sqlalchemy.orm import Session
from typing import List, Optional
import os

from ..models.document import DocumentType, Document
from ..schemas.document import DocumentTypeCreate, DocumentCreate


class DocumentService:
    @staticmethod
    def create_type(db: Session, payload: DocumentTypeCreate) -> DocumentType:
        dt = DocumentType(**payload.dict())
        db.add(dt)
        db.commit()
        db.refresh(dt)
        return dt

    @staticmethod
    def list_types(db: Session) -> List[DocumentType]:
        return db.query(DocumentType).filter(DocumentType.active == True).order_by(DocumentType.name.asc()).all()

    @staticmethod
    def create_document(db: Session, payload: DocumentCreate, uploaded_by: Optional[int]) -> Document:
        doc = Document(**payload.dict(), uploaded_by=uploaded_by)
        # Asegurar directorio
        os.makedirs(os.path.dirname(doc.filepath), exist_ok=True)
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def list_by_quotation(db: Session, quotation_id: int) -> List[Document]:
        return db.query(Document).filter(Document.id_cotizacion == quotation_id).order_by(Document.id.desc()).all()

    @staticmethod
    def update_status(db: Session, document_id: int, status: str, note: Optional[str]) -> Optional[Document]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return None
        doc.status = status
        doc.note = note
        db.commit()
        db.refresh(doc)
        return doc


