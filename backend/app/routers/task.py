from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.task import Task
from app.auth import require_roles
from app.utils.audit import create_audit_log


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def validate_task_data(
    task_data: dict,
    db: Session,
    task_id: int | None = None
):
    if not task_data:
        raise HTTPException(
            status_code=400,
            detail="Task data is required"
        )

    task_name = task_data.get("task_name")

    if task_name is not None:
        task_name = str(task_name).strip()

        if not task_name:
            raise HTTPException(
                status_code=400,
                detail="Task name cannot be empty"
            )

        duplicate = db.query(Task).filter(
            Task.task_name == task_name
        )

        if task_id is not None:
            duplicate = duplicate.filter(
                Task.task_id != task_id
            )

        if duplicate.first():
            raise HTTPException(
                status_code=409,
                detail="Task already exists"
            )

        task_data["task_name"] = task_name

    if "status" in task_data:
        allowed_statuses = [
            "Pending",
            "In Progress",
            "Completed",
            "Cancelled"
        ]

        if task_data["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid task status"
            )

    if "priority" in task_data:
        allowed_priorities = [
            "Low",
            "Medium",
            "High"
        ]

        if task_data["priority"] not in allowed_priorities:
            raise HTTPException(
                status_code=400,
                detail="Priority must be Low, Medium, or High"
            )

    if "description" in task_data:
        if task_data["description"] is not None:
            if not str(task_data["description"]).strip():
                raise HTTPException(
                    status_code=400,
                    detail="Task description cannot be empty"
                )


# CREATE TASK
@router.post("/")
def create_task(
    task_data: dict,
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
    validate_task_data(
        task_data,
        db
    )

    try:
        new_task = Task(
            **task_data
        )

        db.add(new_task)
        db.commit()
        db.refresh(new_task)

        create_audit_log(
            db,
            current_user,
            "CREATE",
            "Tasks",
            new_task.task_id,
            "Task created successfully"
        )

        return new_task

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# GET ALL TASKS
@router.get("/")
def get_tasks(
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
    return db.query(Task).all()


# UPDATE TASK
@router.put("/{task_id}")
def update_task(
    task_id: int,
    task_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin",
            "Manager"
        )
    )
):
    task = db.query(Task).filter(
        Task.task_id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    validate_task_data(
        task_data,
        db,
        task_id
    )

    try:
        for key, value in task_data.items():
            if hasattr(task, key):
                setattr(
                    task,
                    key,
                    value
                )

        db.commit()
        db.refresh(task)

        create_audit_log(
            db,
            current_user,
            "UPDATE",
            "Tasks",
            task.task_id,
            "Task updated successfully"
        )

        return task

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# DELETE TASK
@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "Super Admin",
            "Company Admin"
        )
    )
):
    task = db.query(Task).filter(
        Task.task_id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    db.delete(task)
    db.commit()

    create_audit_log(
        db,
        current_user,
        "DELETE",
        "Tasks",
        task_id,
        "Task deleted successfully"
    )

    return {
        "message": "Task deleted successfully",
        "task_id": task_id
    }