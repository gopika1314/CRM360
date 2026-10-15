from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib
import os

from app.database.connection import SessionLocal
from app.models.user import User
from app.auth import create_access_token, require_roles, verify_token
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    salt = os.urandom(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100000
    )

    return salt.hex() + ":" + password_hash.hex()


def verify_password(
    password: str,
    stored_password: str
) -> bool:
    try:
        salt_hex, hash_hex = stored_password.split(":")

        salt = bytes.fromhex(salt_hex)

        password_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            100000
        )

        return password_hash.hex() == hash_hex

    except Exception:
        return False


def validate_password(password: str):
    if not password:
        raise HTTPException(
            status_code=400,
            detail="Password is required"
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long"
        )


def validate_email(email: str):
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    email = email.strip()

    if "@" not in email:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address"
        )

    parts = email.split("@")

    if len(parts) != 2:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address"
        )

    if not parts[0] or "." not in parts[1]:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address"
        )


def validate_user_data(
    user_data: dict,
    db: Session
):
    full_name = user_data.get("full_name")
    username = user_data.get("username")
    email = user_data.get("email")
    password = user_data.get("password")

    if not full_name or not str(full_name).strip():
        raise HTTPException(
            status_code=400,
            detail="Full name is required"
        )

    if not username or not str(username).strip():
        raise HTTPException(
            status_code=400,
            detail="Username is required"
        )

    if not email or not str(email).strip():
        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    if not password:
        raise HTTPException(
            status_code=400,
            detail="Password is required"
        )

    validate_password(password)

    username = str(username).strip()
    email = str(email).strip()

    validate_email(email)

    existing_username = db.query(User).filter(
        User.username == username
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )

    existing_email = db.query(User).filter(
        User.email == email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="Email already exists"
        )

    return (
        str(full_name).strip(),
        username,
        email
    )


# SIGNUP
@router.post("/signup")
def signup(
    user_data: dict,
    db: Session = Depends(get_db)
):
    full_name, username, email = validate_user_data(
        user_data,
        db
    )

    new_user = User(
        full_name=full_name,
        username=username,
        email=email,
        password_hash=hash_password(
            user_data["password"]
        )
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    create_audit_log(
        db,
        {
            "user_id": new_user.user_id,
            "username": new_user.username
        },
        "SIGNUP",
        "Users",
        new_user.user_id,
        "New user account created"
    )

    return {
        "message": "Account created successfully",
        "user_id": new_user.user_id,
        "username": new_user.username,
        "role": new_user.role
    }


# LOGIN
@router.post("/login")
def login(
    user_data: dict,
    db: Session = Depends(get_db)
):
    username = user_data.get("username")
    password = user_data.get("password")

    if not username or not str(username).strip():
        raise HTTPException(
            status_code=400,
            detail="Username is required"
        )

    if not password:
        raise HTTPException(
            status_code=400,
            detail="Password is required"
        )

    username = str(username).strip()

    user = db.query(User).filter(
        User.username == username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(
        password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = create_access_token({
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role
    })

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "full_name": user.full_name,
        "username": user.username,
        "email": user.email,
        "role": user.role
    }


# GET ALL USERS
@router.get("/")
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Super Admin",
            "Company Admin"
        )
    )
):
    users = (
        db.query(User)
        .order_by(User.user_id.asc())
        .all()
    )

    return [
        {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
        for user in users
    ]


# CHANGE OWN PASSWORD
@router.post("/change-password")
def change_password(
    user_data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(verify_token)
):
    current_password = user_data.get(
        "current_password"
    )

    new_password = user_data.get(
        "new_password"
    )

    if not current_password or not new_password:
        raise HTTPException(
            status_code=400,
            detail="Current password and new password are required"
        )

    validate_password(new_password)

    if current_password == new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password"
        )

    user = db.query(User).filter(
        User.user_id == current_user["user_id"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        current_password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Current password is incorrect"
        )

    user.password_hash = hash_password(
        new_password
    )

    db.commit()

    create_audit_log(
        db,
        current_user,
        "CHANGE_PASSWORD",
        "Users",
        user.user_id,
        "User changed their password"
    )

    return {
        "message": "Password changed successfully"
    }


# RESET ANOTHER USER'S PASSWORD
@router.post("/reset-password/{user_id}")
def reset_password(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("Super Admin")
    )
):
    new_password = user_data.get(
        "new_password"
    )

    if not new_password:
        raise HTTPException(
            status_code=400,
            detail="New password is required"
        )

    validate_password(new_password)

    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.user_id == current_user["user_id"]:
        raise HTTPException(
            status_code=400,
            detail="Use change-password to change your own password"
        )

    user.password_hash = hash_password(
        new_password
    )

    db.commit()

    create_audit_log(
        db,
        current_user,
        "RESET_PASSWORD",
        "Users",
        user.user_id,
        "Super Admin reset user password"
    )

    return {
        "message": "User password reset successfully",
        "user_id": user.user_id,
        "username": user.username
    }


# CHANGE USER ROLE
@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("Super Admin")
    )
):
    new_role = user_data.get("role")

    allowed_roles = [
        "Super Admin",
        "Company Admin",
        "Manager",
        "Employee"
    ]

    if new_role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.user_id == current_user["user_id"]:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role"
        )

    old_role = user.role

    user.role = new_role

    db.commit()
    db.refresh(user)

    create_audit_log(
        db,
        current_user,
        "UPDATE_ROLE",
        "Users",
        user.user_id,
        f"User role changed from {old_role} to {new_role}"
    )

    return {
        "message": "User role updated successfully",
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role
    }