from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import EmailStr, TypeAdapter

from app.database.connection import SessionLocal
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.auth import require_roles
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
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


def validate_customer_data(
    customer: CustomerCreate,
    db: Session,
    customer_id: int | None = None
):
    if not customer.customer_name or not customer.customer_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Customer name is required"
        )

    if not customer.customer_code or not customer.customer_code.strip():
        raise HTTPException(
            status_code=400,
            detail="Customer code is required"
        )

    if customer.email_address:
        validate_email(customer.email_address)

    allowed_statuses = [
        "Active",
        "Inactive"
    ]

    if customer.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Status must be Active or Inactive"
        )

    duplicate_code_query = db.query(Customer).filter(
        Customer.customer_code == customer.customer_code
    )

    if customer_id is not None:
        duplicate_code_query = duplicate_code_query.filter(
            Customer.customer_id != customer_id
        )

    if duplicate_code_query.first():
        raise HTTPException(
            status_code=409,
            detail="Customer code already exists"
        )

    if customer.email_address:
        duplicate_email_query = db.query(Customer).filter(
            Customer.email_address == customer.email_address
        )

        if customer_id is not None:
            duplicate_email_query = duplicate_email_query.filter(
                Customer.customer_id != customer_id
            )

        if duplicate_email_query.first():
            raise HTTPException(
                status_code=409,
                detail="Customer email already exists"
            )

    if customer.phone_number:
        phone = customer.phone_number.strip()

        cleaned_phone = (
            phone.replace("+", "")
            .replace("-", "")
            .replace(" ", "")
        )

        if not cleaned_phone.isdigit():
            raise HTTPException(
                status_code=400,
                detail="Phone number contains invalid characters"
            )

        if len(cleaned_phone) < 10:
            raise HTTPException(
                status_code=400,
                detail="Phone number must contain at least 10 digits"
            )


# CREATE CUSTOMER
@router.post(
    "/",
    response_model=CustomerResponse
)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager",
            "Employee"
        )
    )
):
    validate_customer_data(
        customer,
        db
    )

    new_customer = Customer(
        customer_name=customer.customer_name.strip(),
        customer_code=customer.customer_code.strip(),
        email_address=customer.email_address,
        phone_number=customer.phone_number,
        address=customer.address,
        city=customer.city,
        state=customer.state,
        status=customer.status
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    create_audit_log(
        db,
        current_user,
        "CREATE",
        "Customers",
        new_customer.customer_id,
        "Customer created successfully"
    )

    return new_customer


# GET ALL CUSTOMERS
@router.get(
    "/",
    response_model=list[CustomerResponse]
)
def get_customers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager",
            "Employee"
        )
    )
):
    customers = db.query(Customer).all()

    return customers


# UPDATE CUSTOMER
@router.put(
    "/{customer_id}",
    response_model=CustomerResponse
)
def update_customer(
    customer_id: int,
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager"
        )
    )
):
    existing_customer = db.query(Customer).filter(
        Customer.customer_id == customer_id
    ).first()

    if not existing_customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    validate_customer_data(
        customer,
        db,
        customer_id
    )

    existing_customer.customer_name = (
        customer.customer_name.strip()
    )

    existing_customer.customer_code = (
        customer.customer_code.strip()
    )

    existing_customer.email_address = (
        customer.email_address
    )

    existing_customer.phone_number = (
        customer.phone_number
    )

    existing_customer.address = (
        customer.address
    )

    existing_customer.city = (
        customer.city
    )

    existing_customer.state = (
        customer.state
    )

    existing_customer.status = (
        customer.status
    )

    db.commit()
    db.refresh(existing_customer)

    create_audit_log(
        db,
        current_user,
        "UPDATE",
        "Customers",
        existing_customer.customer_id,
        "Customer updated successfully"
    )

    return existing_customer


# DELETE CUSTOMER
@router.delete(
    "/{customer_id}"
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin"
        )
    )
):
    existing_customer = db.query(Customer).filter(
        Customer.customer_id == customer_id
    ).first()

    if not existing_customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    db.delete(existing_customer)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "DELETE",
        "Customers",
        customer_id,
        "Customer deleted successfully"
    )

    return {
        "message": "Customer deleted successfully"
    }