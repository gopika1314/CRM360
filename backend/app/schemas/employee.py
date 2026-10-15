from pydantic import BaseModel, EmailStr
from typing import Optional, Literal


class EmployeeCreate(BaseModel):
    company_id: int

    employee_name: str
    employee_code: str

    email_address: Optional[EmailStr] = None
    phone_number: Optional[str] = None

    designation: Optional[str] = None
    department: Optional[str] = None

    status: Literal["Active", "Inactive"] = "Active"