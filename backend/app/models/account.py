from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    account_name = Column(
        String(200),
        nullable=False
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.company_id"),
        nullable=False
    )

    account_type = Column(
        String(100),
        nullable=True
    )

    industry = Column(
        String(100),
        nullable=True
    )

    phone = Column(
        String(20),
        nullable=True
    )

    email = Column(
        String(255),
        nullable=True
    )

    address = Column(
        Text,
        nullable=True
    )

    website = Column(
        String(255),
        nullable=True
    )

    annual_revenue = Column(
        Numeric(12, 2),
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False,
        default="Active"
    )

    company = relationship("Company")