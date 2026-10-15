from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    task_name = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False,
        default="Pending"
    )

    priority = Column(
        String(50),
        nullable=False,
        default="Medium"
    )

    due_date = Column(
        String(20),
        nullable=True
    )

    assigned_employee_id = Column(
        Integer,
        ForeignKey("employees.employee_id"),
        nullable=True
    )

    related_customer_id = Column(
        Integer,
        ForeignKey("customers.customer_id"),
        nullable=True
    )

    assigned_employee = relationship("Employee")

    related_customer = relationship("Customer")