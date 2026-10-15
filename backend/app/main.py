from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.base import Base
from app.database.connection import engine

from app.models.company import Company
from app.models.employee import Employee
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.activity import Activity
from app.models.task import Task
from app.models.meeting import Meeting
from app.models.user import User
from app.models.location import LocationTracking
from app.models.audit_log import AuditLog
from app.models.account import Account
from app.models.contact import Contact
from app.models.visit import Visit

from app.routers.company import router as company_router
from app.routers.employee import router as employee_router
from app.routers.customer import router as customer_router
from app.routers.lead import router as lead_router
from app.routers.opportunity import router as opportunity_router
from app.routers.activity import router as activity_router
from app.routers.task import router as task_router
from app.routers.meeting import router as meeting_router
from app.routers.user import router as user_router
from app.routers.location import router as location_router
from app.routers.report import router as report_router
from app.routers.audit import router as audit_router
from app.routers.account import router as account_router
from app.routers.contact import router as contact_router
from app.routers.visit import router as visit_router


app = FastAPI(title="CRM 360 API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


app.include_router(company_router)
app.include_router(employee_router)
app.include_router(customer_router)
app.include_router(lead_router)
app.include_router(opportunity_router)
app.include_router(activity_router)
app.include_router(task_router)
app.include_router(meeting_router)
app.include_router(user_router)
app.include_router(location_router)
app.include_router(report_router)
app.include_router(audit_router)
app.include_router(account_router)
app.include_router(contact_router)
app.include_router(visit_router)


@app.get("/")
def home():
    return {"message": "CRM 360 Backend is running"}