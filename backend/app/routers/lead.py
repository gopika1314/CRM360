from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.lead import Lead
from app.models.customer import Customer
from app.models.account import Account
from app.models.company import Company
from app.models.employee import Employee
from app.auth import require_roles
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/leads",
    tags=["Leads"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def validate_lead_data(
    lead_data: dict,
    db: Session,
    lead_id: int | None = None
):
    if not lead_data:
        raise HTTPException(
            status_code=400,
            detail="Lead data is required"
        )

    if not lead_data.get("lead_name"):
        raise HTTPException(
            status_code=400,
            detail="Lead name is required"
        )

    lead_name = lead_data.get("lead_name").strip()

    if not lead_name:
        raise HTTPException(
            status_code=400,
            detail="Lead name is required"
        )

    duplicate = db.query(Lead).filter(
        Lead.lead_name == lead_name
    )

    if lead_id is not None:
        duplicate = duplicate.filter(
            Lead.lead_id != lead_id
        )

    if duplicate.first():
        raise HTTPException(
            status_code=409,
            detail="Lead already exists"
        )

    if "status" in lead_data:
        allowed_statuses = [
            "New",
            "Contacted",
            "Qualified",
            "Proposal Sent",
            "Negotiation",
            "Won",
            "Converted",
            "Lost"
        ]

        if lead_data["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid lead status"
            )

    if "email_address" in lead_data and lead_data["email_address"]:
        email = lead_data["email_address"].strip()

        if "@" not in email or "." not in email.split("@")[-1]:
            raise HTTPException(
                status_code=400,
                detail="Please enter a valid email address"
            )

    if "mobile_number" in lead_data and lead_data["mobile_number"]:
        phone = lead_data["mobile_number"].strip()

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


@router.post("/")
def create_lead(
    lead_data: dict,
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
    validate_lead_data(
        lead_data,
        db
    )

    lead_data["lead_name"] = lead_data["lead_name"].strip()

    try:
        new_lead = Lead(**lead_data)

        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)

        create_audit_log(
            db,
            current_user,
            "CREATE",
            "Leads",
            new_lead.lead_id,
            "Lead created successfully"
        )

        return new_lead

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.get("/")
def get_leads(
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
    return db.query(Lead).all()


@router.put("/{lead_id}")
def update_lead(
    lead_id: int,
    lead_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager"
        )
    )
):
    lead = db.query(Lead).filter(
        Lead.lead_id == lead_id
    ).first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    validate_lead_data(
        lead_data,
        db,
        lead_id
    )

    if "lead_name" in lead_data:
        lead_data["lead_name"] = lead_data["lead_name"].strip()

    try:
        for key, value in lead_data.items():
            if hasattr(lead, key):
                setattr(
                    lead,
                    key,
                    value
                )

        db.commit()
        db.refresh(lead)

        create_audit_log(
            db,
            current_user,
            "UPDATE",
            "Leads",
            lead.lead_id,
            "Lead updated successfully"
        )

        return lead

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@router.delete("/{lead_id}")
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin"
        )
    )
):
    lead = db.query(Lead).filter(
        Lead.lead_id == lead_id
    ).first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    db.delete(lead)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "DELETE",
        "Leads",
        lead_id,
        "Lead deleted successfully"
    )

    return {
        "message": "Lead deleted successfully",
        "lead_id": lead_id
    }


@router.post("/{lead_id}/convert")
def convert_lead(
    lead_id: int,
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
    lead = db.query(Lead).filter(
        Lead.lead_id == lead_id
    ).first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    if lead.status != "Won":
        raise HTTPException(
            status_code=400,
            detail="Only Won leads can be converted"
        )

    if not lead.lead_name:
        raise HTTPException(
            status_code=400,
            detail="Lead name is required for conversion"
        )

    if not lead.contact_person:
        raise HTTPException(
            status_code=400,
            detail="Contact person is required for conversion"
        )

    if not lead.mobile_number:
        raise HTTPException(
            status_code=400,
            detail="Mobile number is required for conversion"
        )

    if not lead.assigned_employee_id:
        raise HTTPException(
            status_code=400,
            detail="Assigned employee is required for conversion"
        )

    company = db.query(Company).filter(
        Company.company_id == company_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    employee = db.query(Employee).filter(
        Employee.employee_id == lead.assigned_employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Assigned employee not found"
        )

    if employee.status != "Active":
        raise HTTPException(
            status_code=400,
            detail="Assigned employee is inactive"
        )

    existing_customer = db.query(Customer).filter(
        Customer.customer_name == lead.lead_name
    ).first()

    if existing_customer:
        raise HTTPException(
            status_code=409,
            detail="Customer already exists for this lead"
        )

    try:
        customer_code = f"CUST-{lead.lead_id:05d}"

        existing_code = db.query(Customer).filter(
            Customer.customer_code == customer_code
        ).first()

        if existing_code:
            raise HTTPException(
                status_code=409,
                detail="Customer code already exists"
            )

        customer = Customer(
            customer_name=lead.lead_name,
            customer_code=customer_code,
            contact_person=lead.contact_person,
            email_address=lead.email_address,
            phone_number=lead.mobile_number,
            industry=lead.industry,
            company_id=company.company_id,
            assigned_employee_id=lead.assigned_employee_id,
            status="Active"
        )

        db.add(customer)
        db.flush()

        account = Account(
            account_name=lead.company_name or lead.lead_name,
            company_id=company.company_id,
            account_type="Customer",
            industry=lead.industry,
            phone=lead.mobile_number,
            email=lead.email_address,
            status="Active"
        )

        db.add(account)
        db.flush()

        lead.status = "Converted"

        db.commit()

        db.refresh(customer)
        db.refresh(account)
        db.refresh(lead)

        create_audit_log(
            db,
            current_user,
            "CONVERT",
            "Leads",
            lead.lead_id,
            f"Lead converted to Customer {customer.customer_id} and Account {account.account_id}"
        )

        return {
            "message": "Lead converted successfully",
            "lead_id": lead.lead_id,
            "customer_id": customer.customer_id,
            "account_id": account.account_id,
            "customer_code": customer.customer_code,
            "lead_status": lead.status
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Lead conversion failed: {str(error)}"
        )