from sqlalchemy import Column, Integer, String

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    full_name = Column(
        String(150),
        nullable=False
    )

    username = Column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )

    email = Column(
        String(150),
        nullable=False,
        unique=True,
        index=True
    )

    password_hash = Column(
        String(300),
        nullable=False
    )

    role = Column(
        String(50),
        nullable=False,
        default="Employee"
    )