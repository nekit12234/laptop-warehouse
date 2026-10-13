import enum
from datetime import datetime
from sqlalchemy import (Column, Integer, String, Float, ForeignKey,
                        DateTime, Enum, Boolean)
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"


class OperationType(str, enum.Enum):
    INCOME = "income"
    OUTCOME = "outcome"
    WRITE_OFF = "write_off"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(60), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    full_name = Column(String(150))
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MANAGER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    contact_person = Column(String(150))
    phone = Column(String(30))
    email = Column(String(120))

    laptops = relationship("Laptop", back_populates="supplier")


class Laptop(Base):
    __tablename__ = "laptops"

    id = Column(Integer, primary_key=True)
    sku = Column(String(40), unique=True, index=True)
    brand = Column(String(80), nullable=False, index=True)
    model = Column(String(120), nullable=False)
    cpu = Column(String(80))
    ram_gb = Column(Integer)
    storage_gb = Column(Integer)
    os = Column(String(60))
    purchase_price = Column(Float, nullable=False)
    sale_price = Column(Float, nullable=False)
    quantity = Column(Integer, default=0)
    min_quantity = Column(Integer, default=3)
    is_archived = Column(Boolean, default=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="laptops")
    operations = relationship("Operation", back_populates="laptop",
    cascade="all, delete-orphan")


class Operation(Base):
    __tablename__ = "operations"

    id = Column(Integer, primary_key=True)
    laptop_id = Column(Integer, ForeignKey("laptops.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(Enum(OperationType), nullable=False)
    quantity = Column(Integer, nullable=False)
    comment = Column(String(255))
    delivered = Column(Boolean, default=False)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    laptop = relationship("Laptop", back_populates="operations")
    user = relationship("User")