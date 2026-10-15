from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database.base import Base


class Company(Base):

    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    company_name = Column(String(200), nullable=False, unique=True)

    company_code = Column(String(50), nullable=False, unique=True)

    email_address = Column(String(255), nullable=True)

    phone_number = Column(String(20), nullable=True)

    address_line_1 = Column(String(255), nullable=True)

    address_line_2 = Column(String(255), nullable=True)

    city = Column(String(100), nullable=True)

    state = Column(String(100), nullable=True)

    country = Column(String(100), nullable=True)

    postal_code = Column(String(20), nullable=True)

    status = Column(String(20), nullable=False, default="Active")

    created_by = Column(String(100), nullable=True)

    created_date = Column(DateTime, server_default=func.now())

    updated_by = Column(String(100), nullable=True)

    updated_date = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )