from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from ..core.database import Base


class EventLog(Base):
    __tablename__ = "event_log"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(50), nullable=False)
    key = Column(String(100), nullable=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


