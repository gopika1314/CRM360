from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.visit import Visit
from app.models.employee import Employee
from app.auth import verify_token
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/visits",
    tags=["Visit Tracking"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


class VisitRequest(BaseModel):
    employee_id: int
    customer_id: int
    account_id: int | None = None
    contact_id: int | None = None
    latitude: float
    longitude: float
    remarks: str | None = None


class VisitCompleteRequest(BaseModel):
    visit_outcome: str
    remarks: str | None = None


def get_employee(employee_id: int, db: Session):
    employee = db.query(Employee).filter(
        Employee.employee_id == employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return employee


def check_employee_access(employee: Employee, current_user: dict):
    role = current_user.get("role")

    if role in ["Super Admin", "Company Admin", "Manager"]:
        return

    if role == "Employee":
        if employee.user_id != current_user.get("user_id"):
            raise HTTPException(
                status_code=403,
                detail="Employees can access only their own visits"
            )

        return

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access visits"
    )


def has_active_check_in(employee_id: int, db: Session):
    from app.models.location import LocationTracking

    check_in = db.query(LocationTracking).filter(
        LocationTracking.employee_id == employee_id,
        LocationTracking.tracking_type == "CHECK_IN"
    ).order_by(
        LocationTracking.location_id.desc()
    ).first()

    if not check_in:
        return False

    check_out = db.query(LocationTracking).filter(
        LocationTracking.employee_id == employee_id,
        LocationTracking.tracking_type == "CHECK_OUT"
    ).order_by(
        LocationTracking.location_id.desc()
    ).first()

    if not check_out:
        return True

    return check_in.location_id > check_out.location_id


@router.post("/start")
def start_visit(
    data: VisitRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    employee = get_employee(
        data.employee_id,
        db
    )

    check_employee_access(
        employee,
        current_user
    )

    if not has_active_check_in(
        data.employee_id,
        db
    ):
        raise HTTPException(
            status_code=400,
            detail="Check-In is required before starting a visit"
        )

    if data.latitude is None or data.longitude is None:
        raise HTTPException(
            status_code=400,
            detail="GPS location is required"
        )

    visit = Visit(
        employee_id=data.employee_id,
        customer_id=data.customer_id,
        account_id=data.account_id,
        contact_id=data.contact_id,
        latitude=data.latitude,
        longitude=data.longitude,
        visit_status="Started",
        start_time=datetime.now(),
        remarks=data.remarks
    )

    db.add(visit)
    db.commit()
    db.refresh(visit)

    create_audit_log(
        db,
        current_user,
        "VISIT_STARTED",
        "Visit Tracking",
        visit.visit_id,
        f"Employee {data.employee_id} started visit for Customer {data.customer_id}"
    )

    return visit


@router.put("/{visit_id}/complete")
def complete_visit(
    visit_id: int,
    data: VisitCompleteRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    visit = db.query(Visit).filter(
        Visit.visit_id == visit_id
    ).first()

    if not visit:
        raise HTTPException(
            status_code=404,
            detail="Visit not found"
        )

    employee = get_employee(
        visit.employee_id,
        db
    )

    check_employee_access(
        employee,
        current_user
    )

    if visit.visit_status != "Started":
        raise HTTPException(
            status_code=400,
            detail="Only started visits can be completed"
        )

    if not data.visit_outcome.strip():
        raise HTTPException(
            status_code=400,
            detail="Visit outcome is required"
        )

    visit.visit_status = "Completed"
    visit.visit_outcome = data.visit_outcome
    visit.remarks = data.remarks
    visit.end_time = datetime.now()

    db.commit()
    db.refresh(visit)

    create_audit_log(
        db,
        current_user,
        "VISIT_COMPLETED",
        "Visit Tracking",
        visit.visit_id,
        f"Visit {visit.visit_id} completed"
    )

    return visit


@router.get("/")
def get_visits(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    role = current_user.get("role")

    query = db.query(Visit)

    if role == "Employee":
        employee = db.query(Employee).filter(
            Employee.user_id == current_user.get("user_id")
        ).first()

        if not employee:
            return []

        query = query.filter(
            Visit.employee_id == employee.employee_id
        )

    return query.order_by(
        Visit.visit_id.desc()
    ).all()


@router.get("/{visit_id}")
def get_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    visit = db.query(Visit).filter(
        Visit.visit_id == visit_id
    ).first()

    if not visit:
        raise HTTPException(
            status_code=404,
            detail="Visit not found"
        )

    employee = get_employee(
        visit.employee_id,
        db
    )

    check_employee_access(
        employee,
        current_user
    )

    return visit
