from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database.base import Base


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True,
        unique=True
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.company_id"),
        nullable=False
    )

    employee_name = Column(String(200), nullable=False)
    employee_code = Column(String(50), nullable=False, unique=True)

    email_address = Column(String(255))
    phone_number = Column(String(20))

    designation = Column(String(100))
    department = Column(String(100))

    status = Column(String(20), nullable=False, default="Active")

    created_by = Column(String(100))
    created_date = Column(DateTime)

    updated_by = Column(String(100))
    updated_date = Column(DateTime)