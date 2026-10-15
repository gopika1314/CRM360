from pydantic import BaseModel, EmailStr
from typing import Optional


class CustomerCreate(BaseModel):
    customer_name: str
    customer_code: str
    email_address: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = "Active"


class CustomerResponse(CustomerCreate):
    customer_id: int

    class Config:
        from_attributes = True