import uuid
from datetime import datetime
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from app.models import User, Supplier, Laptop, Operation, OperationType
from app.schemas import (UserCreate, SupplierCreate, LaptopCreate, LaptopUpdate,
                         OperationCreate)
from app.security import hash_password


def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        role=data.role,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session):
    return db.scalars(select(User).order_by(User.id)).all()


def list_suppliers(db: Session):
    return db.scalars(select(Supplier).order_by(Supplier.name)).all()


def create_supplier(db: Session, data: SupplierCreate) -> Supplier:
    obj = Supplier(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def _generate_sku() -> str:
    return "LP-" + uuid.uuid4().hex[:8].upper()


def list_laptops(db: Session, search=None, in_stock=None, low_stock=None):
    stmt = select(Laptop).where(Laptop.is_archived == False)
    if search:
        stmt = stmt.where(or_(
            Laptop.brand.ilike(f"%{search}%"),
            Laptop.model.ilike(f"%{search}%"),
            Laptop.sku.ilike(f"%{search}%"),
        ))
    if in_stock:
        stmt = stmt.where(Laptop.quantity > 0)
    if low_stock:
        stmt = stmt.where(Laptop.quantity <= Laptop.min_quantity)
    stmt = stmt.order_by(Laptop.id.desc())
    return db.scalars(stmt).all()


def get_laptop(db: Session, lid: int):
    return db.get(Laptop, lid)


def create_laptop(db: Session, data: LaptopCreate) -> Laptop:
    payload = data.model_dump()
    if not payload.get("sku"):
        payload["sku"] = _generate_sku()
    obj = Laptop(**payload)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_laptop(db: Session, lid: int, data: LaptopUpdate):
    obj = get_laptop(db, lid)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def archive_laptop(db: Session, lid: int):
    obj = get_laptop(db, lid)
    if obj:
        obj.is_archived = True
        db.commit()
    return obj


def create_operation(db: Session, data: OperationCreate, user_id):
    laptop = get_laptop(db, data.laptop_id)
    if not laptop:
        raise ValueError("Ноутбук не найден")

    if data.type == OperationType.INCOME:
        laptop.quantity += data.quantity
    elif data.type in (OperationType.OUTCOME, OperationType.WRITE_OFF):
        if laptop.quantity < data.quantity:
            raise ValueError("Недостаточно товара на складе")
        laptop.quantity -= data.quantity

    op = Operation(
        laptop_id=data.laptop_id,
        user_id=user_id,
        type=data.type,
        quantity=data.quantity,
        comment=data.comment,
    )
    db.add(op)
    db.commit()
    db.refresh(op)
    return op


def list_operations(db: Session, laptop_id=None, limit: int = 100):
    stmt = select(Operation)
    if laptop_id:
        stmt = stmt.where(Operation.laptop_id == laptop_id)
    stmt = stmt.order_by(Operation.created_at.desc()).limit(limit)
    return db.scalars(stmt).all()


def mark_delivered(db: Session, operation_id: int, delivered: bool = True):
    op = db.get(Operation, operation_id)
    if not op:
        return None
    if op.type not in (OperationType.OUTCOME, OperationType.WRITE_OFF):
        raise ValueError("Доставку можно отмечать только для расхода")
    op.delivered = delivered
    op.delivered_at = datetime.utcnow() if delivered else None
    db.commit()
    db.refresh(op)
    return op


def get_dashboard_stats(db: Session):
    total_qty = db.scalar(select(func.coalesce(func.sum(Laptop.quantity), 0)))
    purchase_value = db.scalar(select(
        func.coalesce(func.sum(Laptop.quantity * Laptop.purchase_price), 0)
    ))
    sale_value = db.scalar(select(
        func.coalesce(func.sum(Laptop.quantity * Laptop.sale_price), 0)
    ))
    unique_models = db.scalar(
        select(func.count(Laptop.id)).where(Laptop.is_archived == False)
    )
    low_stock_count = db.scalar(
        select(func.count(Laptop.id)).where(
            Laptop.quantity <= Laptop.min_quantity,
            Laptop.is_archived == False,
        )
    )

    top_brands_rows = db.execute(
        select(Laptop.brand, func.sum(Laptop.quantity).label("qty"))
        .where(Laptop.is_archived == False)
        .group_by(Laptop.brand)
        .order_by(func.sum(Laptop.quantity).desc())
        .limit(5)
    ).all()

    low_stock_items = db.scalars(
        select(Laptop)
        .where(Laptop.quantity <= Laptop.min_quantity, Laptop.is_archived == False)
        .order_by(Laptop.quantity.asc())
        .limit(10)
    ).all()

    return {
        "total_quantity": int(total_qty),
        "purchase_value": round(float(purchase_value), 2),
        "sale_value": round(float(sale_value), 2),
        "unique_models": int(unique_models),
        "low_stock_count": int(low_stock_count),
        "top_brands": [{"brand": b, "quantity": int(q)} for b, q in top_brands_rows],
        "low_stock_items": [
            {"id": l.id, "brand": l.brand, "model": l.model,
             "quantity": l.quantity, "min_quantity": l.min_quantity}
            for l in low_stock_items
        ],
    }