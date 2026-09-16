# Import all models to ensure they are registered with SQLAlchemy
from .user import User
from .client import Client
from .quotation import Quotation, QuotationStatusHistory, QuotationStageHistory
from .quotation_item import QuotationItem
from .alert import Alert
from .credit import CreditApplication, CreditApproval, Guarantee
from .discarded import Discarded
from .document import DocumentType, Document
from .inventory import Vehicle, VehicleAssignment, Delivery, DeliveryPhoto
from .payment import PaymentSchedule, Payment
from .event_log import EventLog

__all__ = [
    "User",
    "Client",
    "Quotation",
    "QuotationStatusHistory",
    "QuotationStageHistory",
    "QuotationItem",
    "Alert",
    "CreditApplication",
    "CreditApproval",
    "Guarantee",
    "Discarded",
    "DocumentType",
    "Document",
    "Vehicle",
    "VehicleAssignment",
    "Delivery",
    "DeliveryPhoto",
    "PaymentSchedule",
    "Payment",
    "EventLog",
]
