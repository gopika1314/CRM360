import hashlib
import getpass

from app.database.connection import SessionLocal
from app.models.user import User


def hash_password(password: str) -> str:
    salt = __import__("os").urandom(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100000
    )

    return salt.hex() + ":" + password_hash.hex()


password = getpass.getpass("Enter new Sahil password: ")

if len(password) < 8:
    raise ValueError("Password must be at least 8 characters long")

db = SessionLocal()

try:
    user = db.query(User).filter(
        User.username == "Sahil@123"
    ).first()

    if not user:
        print("Sahil user not found")
    else:
        user.password_hash = hash_password(password)
        db.commit()

        print("Sahil password reset successfully")
        print("Username:", user.username)
        print("Role:", user.role)

finally:
    db.close()