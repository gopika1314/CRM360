from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.activity import Activity
from app.auth import require_roles
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/activities",
    tags=["Activities"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def validate_activity_data(
    activity_data: dict,
    db: Session,
    activity_id: int | None = None
):
    if not activity_data:
        raise HTTPException(
            status_code=400,
            detail="Activity data is required"
        )

    activity_name = activity_data.get("activity_name")

    if activity_name is not None:
        activity_name = str(activity_name).strip()

        if not activity_name:
            raise HTTPException(
                status_code=400,
                detail="Activity name cannot be empty"
            )

        duplicate = db.query(Activity).filter(
            Activity.activity_name == activity_name
        )

        if activity_id is not None:
            duplicate = duplicate.filter(
                Activity.activity_id != activity_id
            )

        if duplicate.first():
            raise HTTPException(
                status_code=409,
                detail="Activity already exists"
            )

        activity_data["activity_name"] = activity_name

    if "status" in activity_data:
        allowed_statuses = [
            "Pending",
            "In Progress",
            "Completed",
            "Cancelled"
        ]

        if activity_data["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid activity status"
            )

    if "description" in activity_data:
        if activity_data["description"] is not None:
            if not str(activity_data["description"]).strip():
                raise HTTPException(
                    status_code=400,
                    detail="Activity description cannot be empty"
                )


# CREATE ACTIVITY
@router.post("/")
def create_activity(
    activity_data: dict,
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
    validate_activity_data(
        activity_data,
        db
    )

    try:
        new_activity = Activity(
            **activity_data
        )

        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)

        create_audit_log(
            db,
            current_user,
            "CREATE",
            "Activities",
            new_activity.activity_id,
            "Activity created successfully"
        )

        return new_activity

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# GET ALL ACTIVITIES
@router.get("/")
def get_activities(
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
    return db.query(Activity).all()


# UPDATE ACTIVITY
@router.put("/{activity_id}")
def update_activity(
    activity_id: int,
    activity_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager"
        )
    )
):
    activity = db.query(Activity).filter(
        Activity.activity_id == activity_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Activity not found"
        )

    validate_activity_data(
        activity_data,
        db,
        activity_id
    )

    try:
        for key, value in activity_data.items():
            if hasattr(activity, key):
                setattr(
                    activity,
                    key,
                    value
                )

        db.commit()
        db.refresh(activity)

        create_audit_log(
            db,
            current_user,
            "UPDATE",
            "Activities",
            activity.activity_id,
            "Activity updated successfully"
        )

        return activity

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# DELETE ACTIVITY
@router.delete("/{activity_id}")
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin"
        )
    )
):
    activity = db.query(Activity).filter(
        Activity.activity_id == activity_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Activity not found"
        )

    db.delete(activity)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "DELETE",
        "Activities",
        activity_id,
        "Activity deleted successfully"
    )

    return {
        "message": "Activity deleted successfully",
        "activity_id": activity_id
    }