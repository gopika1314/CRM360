from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.meeting import Meeting
from app.auth import require_roles
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def validate_meeting_data(
    meeting_data: dict,
    db: Session,
    meeting_id: int | None = None
):
    if not meeting_data:
        raise HTTPException(
            status_code=400,
            detail="Meeting data is required"
        )

    if "meeting_title" in meeting_data:
        meeting_title = meeting_data["meeting_title"]

        if meeting_title is None:
            raise HTTPException(
                status_code=400,
                detail="Meeting title is required"
            )

        meeting_title = str(meeting_title).strip()

        if not meeting_title:
            raise HTTPException(
                status_code=400,
                detail="Meeting title is required"
            )

        duplicate = db.query(Meeting).filter(
            Meeting.meeting_title == meeting_title
        )

        if meeting_id is not None:
            duplicate = duplicate.filter(
                Meeting.meeting_id != meeting_id
            )

        if duplicate.first():
            raise HTTPException(
                status_code=409,
                detail="Meeting already exists"
            )

        meeting_data["meeting_title"] = meeting_title

    if "status" in meeting_data:
        allowed_statuses = [
            "Scheduled",
            "Completed",
            "Cancelled",
            "Postponed"
        ]

        if meeting_data["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid meeting status"
            )

    if "description" in meeting_data:
        if meeting_data["description"] is not None:
            if not str(
                meeting_data["description"]
            ).strip():
                raise HTTPException(
                    status_code=400,
                    detail="Meeting description cannot be empty"
                )


# CREATE MEETING
@router.post("/")
def create_meeting(
    meeting_data: dict,
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
    validate_meeting_data(
        meeting_data,
        db
    )

    try:
        new_meeting = Meeting(
            **meeting_data
        )

        db.add(new_meeting)
        db.commit()
        db.refresh(new_meeting)

        create_audit_log(
            db,
            current_user,
            "CREATE",
            "Meetings",
            new_meeting.meeting_id,
            "Meeting created successfully"
        )

        return new_meeting

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# GET ALL MEETINGS
@router.get("/")
def get_meetings(
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
    return db.query(Meeting).all()


# UPDATE MEETING
@router.put("/{meeting_id}")
def update_meeting(
    meeting_id: int,
    meeting_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager"
        )
    )
):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    validate_meeting_data(
        meeting_data,
        db,
        meeting_id
    )

    try:
        for key, value in meeting_data.items():
            if hasattr(meeting, key):
                setattr(
                    meeting,
                    key,
                    value
                )

        db.commit()
        db.refresh(meeting)

        create_audit_log(
            db,
            current_user,
            "UPDATE",
            "Meetings",
            meeting.meeting_id,
            "Meeting updated successfully"
        )

        return meeting

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# DELETE MEETING
@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin"
        )
    )
):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    db.delete(meeting)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "DELETE",
        "Meetings",
        meeting_id,
        "Meeting deleted successfully"
    )

    return {
        "message": "Meeting deleted successfully",
        "meeting_id": meeting_id
    }