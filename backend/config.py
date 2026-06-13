from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017/lifetracker"
    telegram_bot_token: str = ""
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_claim_email: str = "mailto:you@example.com"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days

    class Config:
        env_file = "../.env"


settings = Settings()
