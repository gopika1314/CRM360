from sqlalchemy import Column, Integer, String, ForeignKey

from app.database.base import Base


class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    customer_name = Column(
        String(200),
        nullable=False
    )

    customer_code = Column(
        String(50),
        unique=True,
        nullable=False
    )

    contact_person = Column(
        String(200),
        nullable=False
    )

    email_address = Column(
        String(255),
        nullable=True
    )

    phone_number = Column(
        String(20),
        nullable=False
    )

    industry = Column(
        String(100),
        nullable=True
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.company_id"),
        nullable=False
    )

    assigned_employee_id = Column(
        Integer,
        ForeignKey("employees.employee_id"),
        nullable=False
    )

    address = Column(
        String(255),
        nullable=True
    )

    city = Column(
        String(100),
        nullable=True
    )

    state = Column(
        String(100),
        nullable=True
    )

    country = Column(
        String(100),
        nullable=True
    )

    status = Column(
        String(20),
        nullable=False,
        default="Active"
    )