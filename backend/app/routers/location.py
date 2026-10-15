from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database.connection import SessionLocal
from app.models.location import LocationTracking
from app.models.employee import Employee
from app.auth import verify_token
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/location",
    tags=["Location Tracking"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


class LocationRequest(BaseModel):
    employee_id: int
    latitude: float
    longitude: float
    location_address: Optional[str] = None


def get_employee(
    employee_id: int,
    db: Session
):
    employee = db.query(Employee).filter(
        Employee.employee_id == employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return employee


def check_employee_access(
    employee: Employee,
    current_user: dict
):
    role = current_user.get("role")

    if role in ["Super Admin", "Company Admin", "Manager"]:
        return

    if role == "Employee":
        if employee.user_id != current_user.get("user_id"):
            raise HTTPException(
                status_code=403,
                detail="Employees can access only their own location"
            )

        return

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access location tracking"
    )


def get_today_check_in(
    employee_id: int,
    db: Session
):
    today = date.today()

    locations = db.query(LocationTracking).filter(
        LocationTracking.employee_id == employee_id,
        LocationTracking.tracking_type == "CHECK_IN"
    ).order_by(
        LocationTracking.location_id.desc()
    ).all()

    for location in locations:
        if location.tracking_time:
            location_date = location.tracking_time.date()

            if location_date == today:
                return location

    return None


def get_latest_check_in(
    employee_id: int,
    db: Session
):
    return db.query(LocationTracking).filter(
        LocationTracking.employee_id == employee_id,
        LocationTracking.tracking_type == "CHECK_IN"
    ).order_by(
        LocationTracking.location_id.desc()
    ).first()


def get_latest_check_out(
    employee_id: int,
    db: Session
):
    return db.query(LocationTracking).filter(
        LocationTracking.employee_id == employee_id,
        LocationTracking.tracking_type == "CHECK_OUT"
    ).order_by(
        LocationTracking.location_id.desc()
    ).first()


def has_active_check_in(
    employee_id: int,
    db: Session
):
    latest_check_in = get_latest_check_in(
        employee_id,
        db
    )

    if not latest_check_in:
        return False

    latest_check_out = get_latest_check_out(
        employee_id,
        db
    )

    if not latest_check_out:
        return True

    return (
        latest_check_in.location_id >
        latest_check_out.location_id
    )


# CHECK-IN
@router.post("/check-in")
def check_in(
    data: LocationRequest,
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

    # Prevent more than one Check-In per day
    today_check_in = get_today_check_in(
        data.employee_id,
        db
    )

    if today_check_in:
        raise HTTPException(
            status_code=400,
            detail="Employee has already checked in today"
        )

    # Prevent Check-In while already active
    if has_active_check_in(
        data.employee_id,
        db
    ):
        raise HTTPException(
            status_code=400,
            detail="Employee is already checked in"
        )

    location = LocationTracking(
        employee_id=data.employee_id,
        tracking_type="CHECK_IN",
        latitude=data.latitude,
        longitude=data.longitude,
        location_address=data.location_address,
        visit_status="IN_PROGRESS"
    )

    db.add(location)
    db.commit()
    db.refresh(location)

    create_audit_log(
        db,
        current_user,
        "CHECK_IN",
        "Location Tracking",
        location.location_id,
        f"Employee {data.employee_id} checked in"
    )

    return {
        "message": "Check-In successful",
        "location_id": location.location_id,
        "employee_id": location.employee_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "tracking_type": location.tracking_type,
        "visit_status": location.visit_status
    }


# CHECK-OUT
@router.post("/check-out")
def check_out(
    data: LocationRequest,
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

    # Check-Out requires an active Check-In
    if not has_active_check_in(
        data.employee_id,
        db
    ):
        raise HTTPException(
            status_code=400,
            detail="Check-In is required before Check-Out"
        )

    location = LocationTracking(
        employee_id=data.employee_id,
        tracking_type="CHECK_OUT",
        latitude=data.latitude,
        longitude=data.longitude,
        location_address=data.location_address,
        visit_status="COMPLETED"
    )

    db.add(location)
    db.commit()
    db.refresh(location)

    create_audit_log(
        db,
        current_user,
        "CHECK_OUT",
        "Location Tracking",
        location.location_id,
        f"Employee {data.employee_id} checked out"
    )

    return {
        "message": "Check-Out successful",
        "location_id": location.location_id,
        "employee_id": location.employee_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "tracking_type": location.tracking_type,
        "visit_status": location.visit_status
    }


# LIVE TRACKING
@router.post("/live")
def live_tracking(
    data: LocationRequest,
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

    # Live Tracking requires an active Check-In
    if not has_active_check_in(
        data.employee_id,
        db
    ):
        raise HTTPException(
            status_code=400,
            detail="Check-In is required before Live Tracking"
        )

    location = LocationTracking(
        employee_id=data.employee_id,
        tracking_type="LIVE",
        latitude=data.latitude,
        longitude=data.longitude,
        location_address=data.location_address,
        visit_status="IN_PROGRESS"
    )

    db.add(location)
    db.commit()
    db.refresh(location)

    create_audit_log(
        db,
        current_user,
        "LIVE_TRACKING",
        "Location Tracking",
        location.location_id,
        f"Live location updated for Employee {data.employee_id}"
    )

    return {
        "message": "Live location updated",
        "location_id": location.location_id,
        "employee_id": location.employee_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "tracking_type": location.tracking_type,
        "visit_status": location.visit_status
    }


# GET EMPLOYEE LOCATIONS
@router.get("/employee/{employee_id}")
def get_employee_locations(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    employee = get_employee(
        employee_id,
        db
    )

    check_employee_access(
        employee,
        current_user
    )

    locations = db.query(LocationTracking).filter(
        LocationTracking.employee_id == employee_id
    ).order_by(
        LocationTracking.location_id.desc()
    ).all()

    return locations


# GET LIVE LOCATION
@router.get("/live/{employee_id}")
def get_live_location(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    employee = get_employee(
        employee_id,
        db
    )

    check_employee_access(
        employee,
        current_user
    )

    # Only return live location when employee is currently checked in
    if not has_active_check_in(
        employee_id,
        db
    ):
        raise HTTPException(
            status_code=404,
            detail="Employee is not currently checked in"
        )

    location = db.query(LocationTracking).filter(
        LocationTracking.employee_id == employee_id,
        LocationTracking.tracking_type == "LIVE"
    ).order_by(
        LocationTracking.location_id.desc()
    ).first()

    if not location:
        raise HTTPException(
            status_code=404,
            detail="No live location found"
        )

    return location