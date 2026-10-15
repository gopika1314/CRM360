from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

from app.database.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    user_id = Column(
        Integer,
        nullable=True
    )

    username = Column(
        String(100),
        nullable=True
    )

    action = Column(
        String(100),
        nullable=False
    )

    module = Column(
        String(100),
        nullable=False
    )

    record_id = Column(
        Integer,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )