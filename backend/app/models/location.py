from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func

from app.database.base import Base


class LocationTracking(Base):
    __tablename__ = "location_tracking"

    location_id = Column(
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

    tracking_type = Column(
        String(50),
        nullable=False
    )

    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )

    location_address = Column(
        String(500),
        nullable=True
    )

    visit_status = Column(
        String(50),
        nullable=True
    )

    tracking_time = Column(
        DateTime,
        server_default=func.getdate(),
        nullable=False
    )