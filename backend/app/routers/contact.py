from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.contact import Contact
from app.auth import verify_token


router = APIRouter(
    prefix="/contacts",
    tags=["Contacts"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# CREATE CONTACT
@router.post("/")
def create_contact(
    contact_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    new_contact = Contact(**contact_data)

    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)

    return new_contact


# GET ALL CONTACTS
@router.get("/")
def get_contacts(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    return db.query(Contact).all()


# UPDATE CONTACT
@router.put("/{contact_id}")
def update_contact(
    contact_id: int,
    contact_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    contact = db.query(Contact).filter(
        Contact.contact_id == contact_id
    ).first()

    if not contact:
        return {"message": "Contact not found"}

    for key, value in contact_data.items():
        if hasattr(contact, key):
            setattr(contact, key, value)

    db.commit()
    db.refresh(contact)

    return contact


# DELETE CONTACT
@router.delete("/{contact_id}")
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    contact = db.query(Contact).filter(
        Contact.contact_id == contact_id
    ).first()

    if not contact:
        return {"message": "Contact not found"}

    db.delete(contact)
    db.commit()

    return {
        "message": "Contact deleted successfully",
        "contact_id": contact_id
    }