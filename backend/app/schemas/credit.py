from pydantic import BaseModel
from typing import Optional


class CreditApplicationBase(BaseModel):
    id_cotizacion: int
    requested_amount: Optional[float] = None
    term_months: Optional[int] = None


class CreditApplicationCreate(CreditApplicationBase):
    pass


class CreditApplication(CreditApplicationBase):
    id: int
    status: str
    approved_amount: Optional[float] = None
    class Config:
        from_attributes = True


class CreditApprovalBase(BaseModel):
    application_id: int
    approved_amount: float
    term_months: int
    letter_number: Optional[str] = None


class CreditApprovalCreate(CreditApprovalBase):
    pass


class CreditApproval(CreditApprovalBase):
    id: int
    class Config:
        from_attributes = True


class GuaranteeBase(BaseModel):
    application_id: int
    type: str
    description: Optional[str] = None
    value: Optional[float] = None


class GuaranteeCreate(GuaranteeBase):
    pass


class Guarantee(GuaranteeBase):
    id: int
    class Config:
        from_attributes = True


