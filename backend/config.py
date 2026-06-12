from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017/lifetracker"
    telegram_bot_token: str = ""
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_claim_email: str = "mailto:you@example.com"

    class Config:
        env_file = "../.env"


settings = Settings()
