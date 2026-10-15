from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey

from app.database.base import Base


class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    meeting_title = Column(
        String(150),
        nullable=False
    )

    description = Column(
        String(500),
        nullable=True
    )

    meeting_date = Column(
        Date,
        nullable=True
    )

    meeting_time = Column(
        Time,
        nullable=True
    )

    location = Column(
        String(200),
        nullable=True
    )

    status = Column(
        String(50),
        nullable=True
    )

    employee_id = Column(
        Integer,
        ForeignKey("employees.employee_id"),
        nullable=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.customer_id"),
        nullable=True
    )