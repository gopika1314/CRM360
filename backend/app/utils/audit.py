from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    current_user: dict,
    action: str,
    module: str,
    record_id: int | None = None,
    description: str | None = None
):
    audit_log = AuditLog(
        user_id=current_user.get("user_id"),
        username=current_user.get("username"),
        action=action,
        module=module,
        record_id=record_id,
        description=description
    )

    db.add(audit_log)
    db.commit()

    return audit_log