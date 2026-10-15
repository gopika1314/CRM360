from datetime import datetime, date, timedelta
from io import BytesIO
import csv

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, inspect

from app.database.connection import SessionLocal
from app.auth import require_roles

from app.models.customer import Customer
from app.models.employee import Employee
from app.models.company import Company
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.activity import Activity
from app.models.task import Task
from app.models.meeting import Meeting
from app.models.visit import Visit
from app.models.location import LocationTracking


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


ALLOWED_ROLES = (
    "Super Admin",
    "Company Admin",
    "Manager"
)


def get_model_columns(model):
    return {column.name for column in inspect(model).columns}


def serialize_model(item):
    if item is None:
        return {}

    result = {}

    for column in inspect(item).mapper.column_attrs:
        value = getattr(item, column.key, None)

        if isinstance(value, (datetime, date)):
            value = value.isoformat()

        result[column.key] = value

    return result


def serialize_list(items):
    return [serialize_model(item) for item in items]


def parse_date(value):
    if not value:
        return None

    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date: {value}. Use YYYY-MM-DD."
        )


def apply_filters(
    query,
    model,
    status=None,
    company_id=None,
    employee_id=None,
    customer_id=None,
    opportunity_id=None,
    lead_source=None,
    start_date=None,
    end_date=None
):
    columns = get_model_columns(model)

    if status and "status" in columns:
        query = query.filter(
            getattr(model, "status") == status
        )

    if company_id:
        if "company_id" in columns:
            query = query.filter(
                getattr(model, "company_id") == company_id
            )

    if employee_id:
        employee_columns = [
            "employee_id",
            "assigned_employee_id",
            "organizer_id"
        ]

        for column_name in employee_columns:
            if column_name in columns:
                query = query.filter(
                    getattr(model, column_name) == employee_id
                )
                break

    if customer_id and "customer_id" in columns:
        query = query.filter(
            getattr(model, "customer_id") == customer_id
        )

    if opportunity_id and "opportunity_id" in columns:
        query = query.filter(
            getattr(model, "opportunity_id") == opportunity_id
        )

    if lead_source and "lead_source" in columns:
        query = query.filter(
            getattr(model, "lead_source") == lead_source
        )

    date_columns = [
        "created_date",
        "activity_date",
        "task_date",
        "meeting_date",
        "start_date",
        "due_date",
        "scheduled_date",
        "close_date",
        "tracking_time",
        "visit_date",
        "start_time"
    ]

    date_column = None

    for column_name in date_columns:
        if column_name in columns:
            date_column = getattr(model, column_name)
            break

    if date_column is not None:

        if start_date:
            query = query.filter(
                date_column >= start_date
            )

        if end_date:
            end_date_exclusive = end_date + timedelta(days=1)

            query = query.filter(
                date_column < end_date_exclusive
            )

    return query


def get_filtered_query(
    db,
    model,
    status=None,
    company_id=None,
    employee_id=None,
    customer_id=None,
    opportunity_id=None,
    lead_source=None,
    start_date=None,
    end_date=None
):
    query = db.query(model)

    return apply_filters(
        query,
        model,
        status,
        company_id,
        employee_id,
        customer_id,
        opportunity_id,
        lead_source,
        start_date,
        end_date
    )


# SUMMARY

@router.get("/summary")
def get_report_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    return {
        "customers": db.query(
            func.count(Customer.customer_id)
        ).scalar() or 0,

        "employees": db.query(
            func.count(Employee.employee_id)
        ).scalar() or 0,

        "companies": db.query(
            func.count(Company.company_id)
        ).scalar() or 0,

        "leads": db.query(
            func.count(Lead.lead_id)
        ).scalar() or 0,

        "opportunities": db.query(
            func.count(Opportunity.opportunity_id)
        ).scalar() or 0,

        "activities": db.query(
            func.count(Activity.activity_id)
        ).scalar() or 0,

        "tasks": db.query(
            func.count(Task.task_id)
        ).scalar() or 0,

        "meetings": db.query(
            func.count(Meeting.meeting_id)
        ).scalar() or 0,

        "visits": db.query(
            func.count(Visit.visit_id)
        ).scalar() or 0,

        "check_ins": db.query(
            func.count(LocationTracking.location_id)
        ).filter(
            LocationTracking.tracking_type == "CHECK_IN"
        ).scalar() or 0,

        "check_outs": db.query(
            func.count(LocationTracking.location_id)
        ).filter(
            LocationTracking.tracking_type == "CHECK_OUT"
        ).scalar() or 0
    }


# CUSTOMER REPORT

@router.get("/customers")
def get_customer_report(
    status: str | None = Query(None),
    company_id: int | None = Query(None),
    employee_id: int | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    return serialize_list(
        get_filtered_query(
            db,
            Customer,
            status=status,
            company_id=company_id,
            employee_id=employee_id,
            start_date=parse_date(start_date),
            end_date=parse_date(end_date)
        ).all()
    )


# EMPLOYEE REPORT

@router.get("/employees")
def get_employee_report(
    status: str | None = Query(None),
    company_id: int | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    return serialize_list(
        get_filtered_query(
            db,
            Employee,
            status=status,
            company_id=company_id,
            start_date=parse_date(start_date),
            end_date=parse_date(end_date)
        ).all()
    )


# COMPANY REPORT

@router.get("/companies")
def get_company_report(
    status: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    return serialize_list(
        get_filtered_query(
            db,
            Company,
            status=status,
            start_date=parse_date(start_date),
            end_date=parse_date(end_date)
        ).all()
    )


# LEAD REPORT

@router.get("/leads")
def get_lead_report(
    status: str | None = Query(None),
    company_id: int | None = Query(None),
    employee_id: int | None = Query(None),
    lead_source: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    return serialize_list(
        get_filtered_query(
            db,
            Lead,
            status=status,
            company_id=company_id,
            employee_id=employee_id,
            lead_source=lead_source,
            start_date=parse_date(start_date),
            end_date=parse_date(end_date)
        ).all()
    )


# OPPORTUNITY REPORT

@router.get("/opportunities")
def get_opportunity_report(
    status: str | None = Query(None),
    company_id: int | None = Query(None),
    employee_id: int | None = Query(None),
    customer_id: int | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    return serialize_list(
        get_filtered_query(
            db,
            Opportunity,
            status=status,
            company_id=company_id,
            employee_id=employee_id,
            customer_id=customer_id,
            start_date=parse_date(start_date),
            end_date=parse_date(end_date)
        ).all()
    )


# ACTIVITY REPORT

@router.get("/activities")
def get_activity_report(
    status: str | None = Query(None),
    company_id: int | None = Query(None),
    employee_id: int | None = Query(None),
    customer_id: int | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    return serialize_list(
        get_filtered_query(
            db,
            Activity,
            status=status,
            company_id=company_id,
            employee_id=employee_id,
            customer_id=customer_id,
            start_date=parse_date(start_date),
            end_date=parse_date(end_date)
        ).all()
    )


# TASK REPORT

@router.get("/tasks")
def get_task_report(
    status: str | None = Query(None),
    company_id: int | None = Query(None),
    employee_id: int | None = Query(None),
    customer_id: int | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    return serialize_list(
        get_filtered_query(
            db,
            Task,
            status=status,
            company_id=company_id,
            employee_id=employee_id,
            customer_id=customer_id,
            start_date=parse_date(start_date),
            end_date=parse_date(end_date)
        ).all()
    )


# MEETING REPORT

@router.get("/meetings")
def get_meeting_report(
    status: str | None = Query(None),
    company_id: int | None = Query(None),
    employee_id: int | None = Query(None),
    customer_id: int | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    return serialize_list(
        get_filtered_query(
            db,
            Meeting,
            status=status,
            company_id=company_id,
            employee_id=employee_id,
            customer_id=customer_id,
            start_date=parse_date(start_date),
            end_date=parse_date(end_date)
        ).all()
    )


# VISIT REPORT

@router.get("/visits")
def get_visit_report(
    status: str | None = Query(None),
    company_id: int | None = Query(None),
    employee_id: int | None = Query(None),
    customer_id: int | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    return serialize_list(
        get_filtered_query(
            db,
            Visit,
            status=status,
            company_id=company_id,
            employee_id=employee_id,
            customer_id=customer_id,
            start_date=parse_date(start_date),
            end_date=parse_date(end_date)
        ).all()
    )


# ATTENDANCE REPORT

@router.get("/attendance")
def get_attendance_report(
    employee_id: int | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    query = db.query(LocationTracking).filter(
        LocationTracking.tracking_type.in_(
            ["CHECK_IN", "CHECK_OUT"]
        )
    )

    if employee_id:
        query = query.filter(
            LocationTracking.employee_id == employee_id
        )

    if start_date:
        query = query.filter(
            LocationTracking.tracking_time >= parse_date(start_date)
        )

    if end_date:
        query = query.filter(
            LocationTracking.tracking_time <
            parse_date(end_date) + timedelta(days=1)
        )

    records = query.order_by(
        LocationTracking.tracking_time.desc()
    ).all()

    return serialize_list(records)


# GEO TRACKING REPORT

@router.get("/geo")
def get_geo_report(
    employee_id: int | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    query = db.query(LocationTracking)

    if employee_id:
        query = query.filter(
            LocationTracking.employee_id == employee_id
        )

    if start_date:
        query = query.filter(
            LocationTracking.tracking_time >= parse_date(start_date)
        )

    if end_date:
        query = query.filter(
            LocationTracking.tracking_time <
            parse_date(end_date) + timedelta(days=1)
        )

    records = query.order_by(
        LocationTracking.tracking_time.desc()
    ).all()

    return serialize_list(records)


# EXPORT

REPORT_MODELS = {
    "customers": Customer,
    "employees": Employee,
    "companies": Company,
    "leads": Lead,
    "opportunities": Opportunity,
    "activities": Activity,
    "tasks": Task,
    "meetings": Meeting,
    "visits": Visit,
    "attendance": LocationTracking,
    "geo": LocationTracking
}


@router.get("/export/{report_type}")
def export_report(
    report_type: str,
    format: str = Query("csv"),
    status: str | None = Query(None),
    company_id: int | None = Query(None),
    employee_id: int | None = Query(None),
    customer_id: int | None = Query(None),
    lead_source: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ALLOWED_ROLES))
):
    if report_type not in REPORT_MODELS:
        raise HTTPException(
            status_code=404,
            detail="Report type not found"
        )

    if format not in ["csv", "xlsx", "pdf"]:
        raise HTTPException(
            status_code=400,
            detail="Supported formats are csv, xlsx and pdf"
        )

    model = REPORT_MODELS[report_type]

    if report_type in ["attendance", "geo"]:
        query = db.query(model)

        if report_type == "attendance":
            query = query.filter(
                LocationTracking.tracking_type.in_(
                    ["CHECK_IN", "CHECK_OUT"]
                )
            )

        if employee_id:
            query = query.filter(
                LocationTracking.employee_id == employee_id
            )

        if start_date:
            query = query.filter(
                LocationTracking.tracking_time >= parse_date(start_date)
            )

        if end_date:
            query = query.filter(
                LocationTracking.tracking_time <
                parse_date(end_date) + timedelta(days=1)
            )

        records = query.order_by(
            LocationTracking.tracking_time.desc()
        ).all()

    else:
        records = get_filtered_query(
            db,
            model,
            status=status,
            company_id=company_id,
            employee_id=employee_id,
            customer_id=customer_id,
            lead_source=lead_source,
            start_date=parse_date(start_date),
            end_date=parse_date(end_date)
        ).all()

    rows = serialize_list(records)

    if not rows:
        rows = [{"Message": "No records found"}]

    headers = list(rows[0].keys())

    if format == "csv":
        output = BytesIO()
        text_output = output

        import io

        string_output = io.StringIO()

        writer = csv.DictWriter(
            string_output,
            fieldnames=headers,
            extrasaction="ignore"
        )

        writer.writeheader()
        writer.writerows(rows)

        output.write(
            string_output.getvalue().encode("utf-8-sig")
        )

        output.seek(0)

        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={
                "Content-Disposition":
                f'attachment; filename="CRM360_{report_type}.csv"'
            }
        )

    if format == "xlsx":
        try:
            from openpyxl import Workbook
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="openpyxl is not installed. Run: pip install openpyxl"
            )

        workbook = Workbook()
        sheet = workbook.active
        sheet.title = report_type[:31]

        sheet.append(headers)

        for row in rows:
            sheet.append([
                str(row.get(header, ""))
                if row.get(header) is not None
                else ""
                for header in headers
            ])

        for column in sheet.columns:
            max_length = 0

            for cell in column:
                value = str(cell.value or "")

                if len(value) > max_length:
                    max_length = len(value)

            sheet.column_dimensions[
                column[0].column_letter
            ].width = min(max_length + 2, 40)

        output = BytesIO()
        workbook.save(output)
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition":
                f'attachment; filename="CRM360_{report_type}.xlsx"'
            }
        )

    if format == "pdf":
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import landscape, A4
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.platypus import (
                SimpleDocTemplate,
                Table,
                TableStyle,
                Paragraph
            )
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="reportlab is not installed. Run: pip install reportlab"
            )

        output = BytesIO()

        document = SimpleDocTemplate(
            output,
            pagesize=landscape(A4),
            rightMargin=20,
            leftMargin=20,
            topMargin=20,
            bottomMargin=20
        )

        styles = getSampleStyleSheet()

        title = Paragraph(
            f"CRM 360 - {report_type.title()} Report",
            styles["Title"]
        )

        table_data = [headers]

        for row in rows:
            table_data.append([
                str(row.get(header, ""))
                if row.get(header) is not None
                else ""
                for header in headers
            ])

        if len(headers) > 8:
            headers_for_pdf = headers[:8]

            table_data = [headers_for_pdf]

            for row in rows:
                table_data.append([
                    str(row.get(header, ""))
                    if row.get(header) is not None
                    else ""
                    for header in headers_for_pdf
                ])

        table = Table(
            table_data,
            repeatRows=1
        )

        table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#1f4e78")
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold"
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    7
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP"
                )
            ])
        )

        document.build([
            title,
            table
        ])

        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                f'attachment; filename="CRM360_{report_type}.pdf"'
            }
        )