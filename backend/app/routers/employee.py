from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import EmailStr, TypeAdapter

from app.database.connection import SessionLocal
from app.models.employee import Employee
from app.models.company import Company
from app.models.user import User
from app.schemas.employee import EmployeeCreate
from app.auth import require_roles, verify_token
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
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


def validate_employee_data(
    employee: EmployeeCreate,
    db: Session,
    employee_id: int | None = None
):
    if not employee.employee_name or not employee.employee_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Employee name is required"
        )

    if not employee.employee_code or not employee.employee_code.strip():
        raise HTTPException(
            status_code=400,
            detail="Employee code is required"
        )

    company = (
        db.query(Company)
        .filter(
            Company.company_id == employee.company_id
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=400,
            detail="Company does not exist"
        )

    if employee.email_address:
        validate_email(employee.email_address)

    allowed_statuses = [
        "Active",
        "Inactive"
    ]

    if employee.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Status must be Active or Inactive"
        )

    duplicate_code = (
        db.query(Employee)
        .filter(
            Employee.employee_code ==
            employee.employee_code
        )
    )

    if employee_id is not None:
        duplicate_code = duplicate_code.filter(
            Employee.employee_id != employee_id
        )

    if duplicate_code.first():
        raise HTTPException(
            status_code=409,
            detail="Employee code already exists"
        )

    if employee.email_address:
        duplicate_email = (
            db.query(Employee)
            .filter(
                Employee.email_address ==
                employee.email_address
            )
        )

        if employee_id is not None:
            duplicate_email = duplicate_email.filter(
                Employee.employee_id != employee_id
            )

        if duplicate_email.first():
            raise HTTPException(
                status_code=409,
                detail="Employee email already exists"
            )

    if employee.phone_number:
        phone = employee.phone_number.strip()

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


# CREATE EMPLOYEE
@router.post("/")
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin"
        )
    )
):
    validate_employee_data(
        employee,
        db
    )

    try:
        new_employee = Employee(
            company_id=employee.company_id,
            employee_name=employee.employee_name.strip(),
            employee_code=employee.employee_code.strip(),
            email_address=employee.email_address,
            phone_number=employee.phone_number,
            designation=employee.designation,
            department=employee.department,
            status=employee.status
        )

        db.add(new_employee)
        db.commit()
        db.refresh(new_employee)

        create_audit_log(
            db,
            current_user,
            "CREATE",
            "Employees",
            new_employee.employee_id,
            "Employee created successfully"
        )

        return new_employee

    except SQLAlchemyError as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# GET CURRENT LOGGED-IN EMPLOYEE
@router.get("/me")
def get_my_employee(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id ==
            current_user["user_id"]
        )
        .first()
    )

    if employee:
        return employee

    user = (
        db.query(User)
        .filter(
            User.user_id ==
            current_user["user_id"]
        )
        .first()
    )

    if user and user.email:
        employee = (
            db.query(Employee)
            .filter(
                Employee.email_address ==
                user.email
            )
            .first()
        )

        if employee:
            return employee

    raise HTTPException(
        status_code=404,
        detail="Employee record not found for this user."
    )


# GET ALL EMPLOYEES
@router.get("/")
def get_employees(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager"
        )
    )
):
    return db.query(Employee).all()


# UPDATE EMPLOYEE
@router.put("/{employee_id}")
def update_employee(
    employee_id: int,
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin"
        )
    )
):
    existing_employee = (
        db.query(Employee)
        .filter(
            Employee.employee_id ==
            employee_id
        )
        .first()
    )

    if not existing_employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    validate_employee_data(
        employee,
        db,
        employee_id
    )

    existing_employee.company_id = employee.company_id
    existing_employee.employee_name = (
        employee.employee_name.strip()
    )
    existing_employee.employee_code = (
        employee.employee_code.strip()
    )
    existing_employee.email_address = (
        employee.email_address
    )
    existing_employee.phone_number = (
        employee.phone_number
    )
    existing_employee.designation = (
        employee.designation
    )
    existing_employee.department = (
        employee.department
    )
    existing_employee.status = (
        employee.status
    )

    db.commit()
    db.refresh(existing_employee)

    create_audit_log(
        db,
        current_user,
        "UPDATE",
        "Employees",
        existing_employee.employee_id,
        "Employee updated successfully"
    )

    return existing_employee


# DELETE EMPLOYEE
@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles("Super Admin")
    )
):
    existing_employee = (
        db.query(Employee)
        .filter(
            Employee.employee_id ==
            employee_id
        )
        .first()
    )

    if not existing_employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    db.delete(existing_employee)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "DELETE",
        "Employees",
        employee_id,
        "Employee deleted successfully"
    )

    return {
        "message": "Employee deleted successfully"
    }