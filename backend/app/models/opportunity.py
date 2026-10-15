from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey

from app.database.base import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    opportunity_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    opportunity_name = Column(
        String(200),
        nullable=False
    )

    account_id = Column(
        Integer,
        ForeignKey("accounts.account_id"),
        nullable=False
    )

    contact_id = Column(
        Integer,
        ForeignKey("contacts.contact_id"),
        nullable=True
    )

    assigned_employee_id = Column(
        Integer,
        ForeignKey("employees.employee_id"),
        nullable=True
    )

    opportunity_type = Column(
        String(100),
        nullable=True
    )

    stage = Column(
        String(100),
        nullable=False,
        default="New"
    )

    expected_revenue = Column(
        Numeric(12, 2),
        nullable=True
    )

    probability = Column(
        Numeric(5, 2),
        nullable=True
    )

    expected_close_date = Column(
        String(20),
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False,
        default="Open"
    )