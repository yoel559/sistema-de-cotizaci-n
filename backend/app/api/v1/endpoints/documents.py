from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os

from ....core.database import get_db
from ....core.security import get_current_active_user
from ....schemas.document import DocumentTypeCreate, DocumentType, DocumentCreate, Document
from ....services.document_service import DocumentService


router = APIRouter()


@router.post("/types", response_model=DocumentType)
async def create_document_type(
    payload: DocumentTypeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return DocumentService.create_type(db, payload)


@router.get("/types", response_model=List[DocumentType])
async def list_document_types(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return DocumentService.list_types(db)


@router.post("/quotations/{quotation_id}", response_model=Document)
async def upload_document(
    quotation_id: int,
    document_type_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Guardado simple en disco local
    folder = os.path.join("storage", "docs", str(quotation_id))
    os.makedirs(folder, exist_ok=True)
    filepath = os.path.join(folder, file.filename)
    with open(filepath, "wb") as f:
        f.write(await file.read())

    payload = DocumentCreate(
        id_cotizacion=quotation_id,
        document_type_id=document_type_id,
        filename=file.filename,
        filepath=filepath,
        mimetype=file.content_type or None,
        status="pendiente",
        note=None,
    )
    return DocumentService.create_document(db, payload, current_user.id_usuario)


@router.get("/quotations/{quotation_id}", response_model=List[Document])
async def list_documents(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return DocumentService.list_by_quotation(db, quotation_id)


@router.patch("/{document_id}/status", response_model=Document)
async def set_document_status(
    document_id: int,
    status: str,
    note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    doc = DocumentService.update_status(db, document_id, status, note)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


