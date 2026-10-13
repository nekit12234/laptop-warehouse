"""Запуск: python -m app.seed"""
from app.database import SessionLocal, engine, Base
from app.models import User, UserRole, Supplier, Laptop
from app.security import hash_password
import app.models


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count():
            print("Данные уже есть")
            return

        db.add_all([
    User(username="admin", email="admin@warehouse.ru",
         full_name="Администратор", role=UserRole.ADMIN,
         hashed_password=hash_password("admin123")),
    User(username="manager", email="manager@warehouse.ru",
         full_name="Иван Менеджеров", role=UserRole.MANAGER,
         hashed_password=hash_password("manager123")),
    User(username="viewer", email="viewer@warehouse.ru",
         full_name="Наблюдатель", role=UserRole.VIEWER,
         hashed_password=hash_password("viewer123")),
])
        db.flush()

        s1 = Supplier(name="Apple Russia", contact_person="Сергей",
                      phone="+7 495 451-00-01", email="sales@apple.ru")
        s2 = Supplier(name="ASUS Distribution", contact_person="Мария",
                      phone="+7 495 000-00-02", email="blas@asus.ru")
        db.add_all([s1, s2]); db.flush()

        db.add_all([
            Laptop(sku="LP-MBP14", brand="Apple", model="MaBook Pro 4",
                   cpu="M3 Pro", ram_gb=18, storage_gb=512, os="macOS",
                   purchase_price=180000, sale_price=219990,
                   quantity=7, min_quantity=2, supplier_id=s1.id),
            Laptop(sku="LP-ROG15", brand="ASUS", model="ROG Strix G15",
                   cpu="Ryzen 7 6800H", ram_gb=16, storage_gb=1024,
                   os="Windows 11", purchase_price=110000,
                   sale_price=139990, quantity=2, min_quantity=3,
                   supplier_id=s2.id),
            Laptop(sku="LP-XPS13", brand="Dell", model="XPS 13",
                   cpu="Intel i7-1360P", ram_gb=16, storage_gb=512,
                   os="Windows 11", purchase_price=130000,
                   sale_price=159990, quantity=5, min_quantity=2),
        ])
        db.commit()
        print("Демо-данные загружены: admin/admin123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()