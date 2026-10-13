from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user, require_roles
from app.models import User, UserRole
from app.schemas import (Token, UserCreate, UserOut, SupplierCreate, SupplierOut,
                         LaptopCreate, LaptopUpdate, LaptopOut,
                         OperationCreate, OperationOut)
from app.security import verify_password, create_access_token
from app import crud

router = APIRouter(prefix="/api")


@router.post("/auth/register", response_model=UserOut, status_code=201, tags=["auth"])
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.username == data.username)):
        raise HTTPException(400, "Логин занят")
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(400, "Email занят")
    return crud.create_user(db, data)


@router.post("/auth/login", response_model=Token, tags=["auth"])
def login(form: OAuth2PasswordRequestForm = Depends(),
          db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == form.username))
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(401, "Неверный логин или пароль")
    token = create_access_token({"sub": user.username, "role": user.role.value})
    return Token(access_token=token, user=user)


@router.get("/users", response_model=List[UserOut], tags=["users"])
def list_users(db: Session = Depends(get_db),
               _: User = Depends(require_roles(UserRole.ADMIN))):
    return crud.list_users(db)


@router.get("/suppliers", response_model=List[SupplierOut], tags=["suppliers"])
def list_suppliers(db: Session = Depends(get_db),
                   _: User = Depends(get_current_user)):
    return crud.list_suppliers(db)


@router.post("/suppliers", response_model=SupplierOut, status_code=201,
             tags=["suppliers"])
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db),
                    _: User = Depends(require_roles(UserRole.ADMIN,
                                                     UserRole.MANAGER))):
    return crud.create_supplier(db, data)


@router.get("/laptops", response_model=List[LaptopOut], tags=["laptops"])
def list_laptops(search: Optional[str] = None,
                 in_stock: Optional[bool] = None,
                 low_stock: Optional[bool] = None,
                 db: Session = Depends(get_db),
                 _: User = Depends(get_current_user)):
    return crud.list_laptops(db, search, in_stock, low_stock)


@router.post("/laptops", response_model=LaptopOut, status_code=201, tags=["laptops"])
def create_laptop(data: LaptopCreate, db: Session = Depends(get_db),
                  _: User = Depends(require_roles(UserRole.ADMIN,
                                                   UserRole.MANAGER))):
    return crud.create_laptop(db, data)


@router.put("/laptops/{lid}", response_model=LaptopOut, tags=["laptops"])
def update_laptop(lid: int, data: LaptopUpdate,
                  db: Session = Depends(get_db),
                  _: User = Depends(require_roles(UserRole.ADMIN,
                                                   UserRole.MANAGER))):
    obj = crud.update_laptop(db, lid, data)
    if not obj:
        raise HTTPException(404, "Ноутбук не найден")
    return obj


@router.delete("/laptops/{lid}", status_code=204, tags=["laptops"])
def archive_laptop(lid: int, db: Session = Depends(get_db),
                   _: User = Depends(require_roles(UserRole.ADMIN))):
    if not crud.archive_laptop(db, lid):
        raise HTTPException(404, "Ноутбук не найден")


@router.post("/operations", response_model=OperationOut, status_code=201,
             tags=["operations"])
def create_operation(data: OperationCreate, db: Session = Depends(get_db),
                     user: User = Depends(get_current_user)):
    try:
        return crud.create_operation(db, data, user.id)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/operations", response_model=List[OperationOut], tags=["operations"])
def list_operations(laptop_id: Optional[int] = None, limit: int = 100,
                    db: Session = Depends(get_db),
                    _: User = Depends(get_current_user)):
    return crud.list_operations(db, laptop_id, limit)




@router.patch("/operations/{op_id}/delivered", response_model=OperationOut, tags=["operations"])
def mark_delivered(op_id: int, delivered: bool = True,
                   db: Session = Depends(get_db),
                   _: User = Depends(get_current_user)):
    try:
        obj = crud.mark_delivered(db, op_id, delivered)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not obj:
        raise HTTPException(404, "Операция не найдена")
    return obj





@router.get("/dashboard", tags=["dashboard"])
def dashboard(db: Session = Depends(get_db),
              _: User = Depends(get_current_user)):
    return crud.get_dashboard_stats(db)