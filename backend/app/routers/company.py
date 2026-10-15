from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import EmailStr, TypeAdapter

from app.database.connection import SessionLocal
from app.models.company import Company
from app.schemas.company import CompanyCreate
from app.auth import require_roles
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/companies",
    tags=["Companies"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def validate_email(email: str):
    try:
        TypeAdapter(EmailStr).validate_python(email)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address"
        )


def validate_company_data(
    company: CompanyCreate,
    db: Session,
    company_id: int | None = None
):
    if not company.company_name or not company.company_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Company name is required"
        )

    if not company.company_code or not company.company_code.strip():
        raise HTTPException(
            status_code=400,
            detail="Company code is required"
        )

    if company.email_address:
        validate_email(company.email_address)

    allowed_statuses = [
        "Active",
        "Inactive"
    ]

    if company.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Status must be Active or Inactive"
        )

    duplicate_code = db.query(Company).filter(
        Company.company_code == company.company_code
    )

    if company_id is not None:
        duplicate_code = duplicate_code.filter(
            Company.company_id != company_id
        )

    if duplicate_code.first():
        raise HTTPException(
            status_code=409,
            detail="Company code already exists"
        )

    if company.email_address:
        duplicate_email = db.query(Company).filter(
            Company.email_address == company.email_address
        )

        if company_id is not None:
            duplicate_email = duplicate_email.filter(
                Company.company_id != company_id
            )

        if duplicate_email.first():
            raise HTTPException(
                status_code=409,
                detail="Company email already exists"
            )

    if company.phone_number:
        phone = company.phone_number.strip()

        digits_only = (
            phone.replace("+", "")
            .replace("-", "")
            .replace(" ", "")
        )

        if not digits_only.isdigit():
            raise HTTPException(
                status_code=400,
                detail="Phone number contains invalid characters"
            )

        if len(digits_only) < 10:
            raise HTTPException(
                status_code=400,
                detail="Phone number must contain at least 10 digits"
            )


# CREATE COMPANY
@router.post("/")
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Super Admin", "Company Admin")
    )
):
    validate_company_data(
        company,
        db
    )

    try:
        new_company = Company(
            company_name=company.company_name.strip(),
            company_code=company.company_code.strip(),
            email_address=company.email_address,
            phone_number=company.phone_number,
            address_line_1=company.address_line_1,
            address_line_2=company.address_line_2,
            city=company.city,
            state=company.state,
            country=company.country,
            postal_code=company.postal_code,
            status=company.status
        )

        db.add(new_company)
        db.commit()
        db.refresh(new_company)

        create_audit_log(
            db,
            current_user,
            "CREATE",
            "Companies",
            new_company.company_id,
            "Company created successfully"
        )

        return new_company

    except SQLAlchemyError as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# GET ALL COMPANIES
@router.get("/")
def get_companies(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager"
        )
    )
):
    return db.query(Company).all()


# GET COMPANY BY ID
@router.get("/{company_id}")
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager"
        )
    )
):
    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    return company


# UPDATE COMPANY
@router.put("/{company_id}")
def update_company(
    company_id: int,
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin"
        )
    )
):
    existing_company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if not existing_company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    validate_company_data(
        company,
        db,
        company_id
    )

    existing_company.company_name = company.company_name.strip()
    existing_company.company_code = company.company_code.strip()
    existing_company.email_address = company.email_address
    existing_company.phone_number = company.phone_number
    existing_company.address_line_1 = company.address_line_1
    existing_company.address_line_2 = company.address_line_2
    existing_company.city = company.city
    existing_company.state = company.state
    existing_company.country = company.country
    existing_company.postal_code = company.postal_code
    existing_company.status = company.status

    db.commit()
    db.refresh(existing_company)

    create_audit_log(
        db,
        current_user,
        "UPDATE",
        "Companies",
        existing_company.company_id,
        "Company updated successfully"
    )

    return existing_company


# DELETE COMPANY
@router.delete("/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Super Admin")
    )
):
    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    db.delete(company)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "DELETE",
        "Companies",
        company_id,
        "Company deleted successfully"
    )

    return {
        "message": "Company deleted successfully"
    }