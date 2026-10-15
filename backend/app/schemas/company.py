from pydantic import BaseModel, EmailStr
from typing import Optional, Literal


class CompanyCreate(BaseModel):

    company_name: str

    company_code: str

    email_address: Optional[EmailStr] = None

    phone_number: Optional[str] = None

    address_line_1: Optional[str] = None

    address_line_2: Optional[str] = None

    city: Optional[str] = None

    state: Optional[str] = None

    country: Optional[str] = None

    postal_code: Optional[str] = None

    status: Literal["Active", "Inactive"] = "Active"