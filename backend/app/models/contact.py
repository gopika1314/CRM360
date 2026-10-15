from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Contact(Base):
    __tablename__ = "contacts"

    contact_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    contact_name = Column(
        String(200),
        nullable=False
    )

    account_id = Column(
        Integer,
        ForeignKey("accounts.account_id"),
        nullable=False
    )

    designation = Column(
        String(100),
        nullable=True
    )

    mobile_number = Column(
        String(20),
        nullable=False
    )

    email_address = Column(
        String(255),
        nullable=True
    )

    department = Column(
        String(100),
        nullable=True
    )

    address = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False,
        default="Active"
    )

    remarks = Column(
        Text,
        nullable=True
    )

    account = relationship("Account")