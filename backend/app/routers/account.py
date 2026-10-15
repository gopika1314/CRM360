from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.account import Account
from app.auth import verify_token


router = APIRouter(
    prefix="/accounts",
    tags=["Accounts"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# CREATE ACCOUNT
@router.post("/")
def create_account(
    account_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    new_account = Account(**account_data)

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return new_account


# GET ALL ACCOUNTS
@router.get("/")
def get_accounts(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    return db.query(Account).all()


# UPDATE ACCOUNT
@router.put("/{account_id}")
def update_account(
    account_id: int,
    account_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    account = db.query(Account).filter(
        Account.account_id == account_id
    ).first()

    if not account:
        return {"message": "Account not found"}

    for key, value in account_data.items():
        if hasattr(account, key):
            setattr(account, key, value)

    db.commit()
    db.refresh(account)

    return account


# DELETE ACCOUNT
@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    account = db.query(Account).filter(
        Account.account_id == account_id
    ).first()

    if not account:
        return {"message": "Account not found"}

    db.delete(account)
    db.commit()

    return {
        "message": "Account deleted successfully",
        "account_id": account_id
    }