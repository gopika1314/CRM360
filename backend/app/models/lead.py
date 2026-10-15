from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Lead(Base):
    __tablename__ = "leads"

    lead_id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    lead_name = Column(String(200), nullable=False)
    company_name = Column(String(200), nullable=True)
    contact_person = Column(String(200), nullable=False)

    mobile_number = Column(String(20), nullable=False)
    email_address = Column(String(255), nullable=True)

    lead_source = Column(String(100), nullable=False)
    industry = Column(String(100), nullable=True)

    status = Column(String(50), nullable=False, default="New")

    assigned_employee_id = Column(
        Integer,
        ForeignKey("employees.employee_id"),
        nullable=False
    )

    expected_revenue = Column(Numeric(12, 2), nullable=True)

    remarks = Column(Text, nullable=True)

    # Relationship with Employee
    assigned_employee = relationship("Employee")