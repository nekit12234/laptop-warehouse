from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models import UserRole, OperationType


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.MANAGER


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierOut(SupplierBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class LaptopBase(BaseModel):
    sku: Optional[str] = None
    brand: str
    model: str
    cpu: Optional[str] = None
    ram_gb: Optional[int] = None
    storage_gb: Optional[int] = None
    os: Optional[str] = None
    purchase_price: float = Field(gt=0)
    sale_price: float = Field(gt=0)
    quantity: int = Field(ge=0, default=0)
    min_quantity: int = Field(ge=0, default=3)
    supplier_id: Optional[int] = None


class LaptopCreate(LaptopBase):
    pass


class LaptopUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    cpu: Optional[str] = None
    ram_gb: Optional[int] = None
    storage_gb: Optional[int] = None
    os: Optional[str] = None
    purchase_price: Optional[float] = None
    sale_price: Optional[float] = None
    quantity: Optional[int] = None
    min_quantity: Optional[int] = None
    supplier_id: Optional[int] = None


class LaptopOut(LaptopBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_archived: bool
    created_at: datetime


class OperationCreate(BaseModel):
    laptop_id: int
    type: OperationType
    quantity: int = Field(gt=0)
    comment: Optional[str] = None


class OperationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    laptop_id: int
    user_id: Optional[int]
    type: OperationType
    quantity: int
    comment: Optional[str]
    delivered: bool
    delivered_at: Optional[datetime] = None
    created_at: datetime