from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Laptop Warehouse API"
    DATABASE_URL: str = "sqlite:///./warehouse.db"
    SECRET_KEY: str = "change-me-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]


settings = Settings()