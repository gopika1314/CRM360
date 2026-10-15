from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.opportunity import Opportunity
from app.auth import require_roles
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/opportunities",
    tags=["Opportunities"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def validate_opportunity_data(
    opportunity_data: dict,
    db: Session,
    opportunity_id: int | None = None
):
    if not opportunity_data:
        raise HTTPException(
            status_code=400,
            detail="Opportunity data is required"
        )

    if "opportunity_name" in opportunity_data:
        if not opportunity_data["opportunity_name"]:
            raise HTTPException(
                status_code=400,
                detail="Opportunity name is required"
            )

        opportunity_name = opportunity_data["opportunity_name"].strip()

        if not opportunity_name:
            raise HTTPException(
                status_code=400,
                detail="Opportunity name is required"
            )

        duplicate = db.query(Opportunity).filter(
            Opportunity.opportunity_name == opportunity_name
        )

        if opportunity_id is not None:
            duplicate = duplicate.filter(
                Opportunity.opportunity_id != opportunity_id
            )

        if duplicate.first():
            raise HTTPException(
                status_code=409,
                detail="Opportunity already exists"
            )

    if "status" in opportunity_data:
        allowed_statuses = [
            "Open",
            "Closed",
            "Inactive"
        ]

        if opportunity_data["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid opportunity status"
            )

    if "stage" in opportunity_data:
        allowed_stages = [
            "New",
            "Qualified",
            "Proposal Sent",
            "Negotiation",
            "Won",
            "Lost"
        ]

        if opportunity_data["stage"] not in allowed_stages:
            raise HTTPException(
                status_code=400,
                detail="Invalid opportunity stage"
            )

    if "expected_revenue" in opportunity_data:
        revenue = opportunity_data["expected_revenue"]

        if revenue is not None:
            try:
                revenue_value = float(revenue)

                if revenue_value < 0:
                    raise HTTPException(
                        status_code=400,
                        detail="Expected revenue cannot be negative"
                    )

            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=400,
                    detail="Expected revenue must be a valid number"
                )

    if "probability" in opportunity_data:
        probability = opportunity_data["probability"]

        if probability is not None:
            try:
                probability_value = float(probability)

                if probability_value < 0 or probability_value > 100:
                    raise HTTPException(
                        status_code=400,
                        detail="Probability must be between 0 and 100"
                    )

            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=400,
                    detail="Probability must be a valid number"
                )


# CREATE OPPORTUNITY
@router.post("/")
def create_opportunity(
    opportunity_data: dict,
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
    validate_opportunity_data(
        opportunity_data,
        db
    )

    if "opportunity_name" in opportunity_data:
        opportunity_data["opportunity_name"] = (
            opportunity_data["opportunity_name"].strip()
        )

    try:
        new_opportunity = Opportunity(
            **opportunity_data
        )

        db.add(new_opportunity)
        db.commit()
        db.refresh(new_opportunity)

        create_audit_log(
            db,
            current_user,
            "CREATE",
            "Opportunities",
            new_opportunity.opportunity_id,
            "Opportunity created successfully"
        )

        return new_opportunity

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# GET ALL OPPORTUNITIES
@router.get("/")
def get_opportunities(
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
    return db.query(Opportunity).all()


# GET OPPORTUNITY BY ID
@router.get("/{opportunity_id}")
def get_opportunity(
    opportunity_id: int,
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
    opportunity = db.query(Opportunity).filter(
        Opportunity.opportunity_id == opportunity_id
    ).first()

    if not opportunity:
        raise HTTPException(
            status_code=404,
            detail="Opportunity not found"
        )

    return opportunity


# UPDATE OPPORTUNITY
@router.put("/{opportunity_id}")
def update_opportunity(
    opportunity_id: int,
    opportunity_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager"
        )
    )
):
    opportunity = db.query(Opportunity).filter(
        Opportunity.opportunity_id == opportunity_id
    ).first()

    if not opportunity:
        raise HTTPException(
            status_code=404,
            detail="Opportunity not found"
        )

    validate_opportunity_data(
        opportunity_data,
        db,
        opportunity_id
    )

    if "opportunity_name" in opportunity_data:
        opportunity_data["opportunity_name"] = (
            opportunity_data["opportunity_name"].strip()
        )

    try:
        for key, value in opportunity_data.items():
            if hasattr(opportunity, key):
                setattr(
                    opportunity,
                    key,
                    value
                )

        db.commit()
        db.refresh(opportunity)

        create_audit_log(
            db,
            current_user,
            "UPDATE",
            "Opportunities",
            opportunity.opportunity_id,
            "Opportunity updated successfully"
        )

        return opportunity

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# DELETE OPPORTUNITY
@router.delete("/{opportunity_id}")
def delete_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin"
        )
    )
):
    opportunity = db.query(Opportunity).filter(
        Opportunity.opportunity_id == opportunity_id
    ).first()

    if not opportunity:
        raise HTTPException(
            status_code=404,
            detail="Opportunity not found"
        )

    db.delete(opportunity)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "DELETE",
        "Opportunities",
        opportunity_id,
        "Opportunity deleted successfully"
    )

    return {
        "message": "Opportunity deleted successfully",
        "opportunity_id": opportunity_id
    }