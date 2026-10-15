from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.sql import func

from app.database.base import Base


class Visit(Base):
    __tablename__ = "visits"

    visit_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    employee_id = Column(
        Integer,
        ForeignKey("employees.employee_id"),
        nullable=False
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.customer_id"),
        nullable=False
    )

    account_id = Column(
        Integer,
        ForeignKey("accounts.account_id"),
        nullable=True
    )

    contact_id = Column(
        Integer,
        ForeignKey("contacts.contact_id"),
        nullable=True
    )

    visit_date = Column(
        DateTime,
        server_default=func.getdate(),
        nullable=False
    )

    start_time = Column(
        DateTime,
        nullable=True
    )

    end_time = Column(
        DateTime,
        nullable=True
    )

    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )

    visit_status = Column(
        String(50),
        nullable=False,
        default="Planned"
    )

    visit_outcome = Column(
        String(100),
        nullable=True
    )

    remarks = Column(
        Text,
        nullable=True
    )