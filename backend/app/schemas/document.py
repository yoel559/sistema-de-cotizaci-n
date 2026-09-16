from pydantic import BaseModel
from typing import Optional


class DocumentTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    required_in_stage: Optional[str] = None
    active: Optional[bool] = True


class DocumentTypeCreate(DocumentTypeBase):
    pass


class DocumentType(DocumentTypeBase):
    id: int
    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    id_cotizacion: int
    document_type_id: int
    filename: str
    filepath: str
    mimetype: Optional[str] = None
    status: Optional[str] = "pendiente"
    note: Optional[str] = None


class DocumentCreate(DocumentBase):
    pass


class Document(DocumentBase):
    id: int
    uploaded_by: Optional[int] = None
    class Config:
        from_attributes = True


