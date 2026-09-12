from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator, ValidationError, ConfigDict
import secrets


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")
    
    app_env: str = "development"
    database_url: str = "sqlite:///./dacexy.db"
    jwt_secret: str = "CHANGE_ME_IN_PRODUCTION"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60  # 1 hour access token

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    razorpay_plan_business: str = ""
    razorpay_plan_enterprise: str = ""
    frontend_url: str = "http://localhost:3000"
    trust_proxy_headers: bool = False

    # Web Business Advisor (OpenAI-compatible DeepSeek endpoint by default)
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_chat_model: str = "deepseek-chat"
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_ttl: int = 3600  # 1 hour default TTL
    enable_cache: bool = True
    auto_create_db: bool = False
    refresh_token_expire_days: int = 30

    @field_validator('jwt_secret')
    @classmethod
    def validate_jwt_secret(cls, v):
        if v == "CHANGE_ME_IN_PRODUCTION" or v == "CHANGE_ME_TO_A_SECURE_RANDOM_STRING_IN_PRODUCTION":
            raise ValueError(
                "JWT_SECRET must be set to a secure random string. "
                "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters long")
        return v

    @field_validator('app_env')
    @classmethod
    def validate_app_env(cls, v):
        value = v.lower().strip()
        if value not in {"development", "test", "production"}:
            raise ValueError("APP_ENV must be development, test, or production")
        return value

    @field_validator('database_url')
    @classmethod
    def validate_database_url(cls, v):
        if not v:
            raise ValueError("DATABASE_URL must be set")
        return v

    @model_validator(mode="after")
    def validate_production_dependencies(self):
        if self.app_env == "production":
            if not self.redis_url:
                raise ValueError("REDIS_URL must be set in production; in-memory rate limiting is not supported for multi-instance production.")
            redis_lower = self.redis_url.lower()
            if any(host in redis_lower for host in ("localhost", "127.0.0.1", "::1")):
                raise ValueError("REDIS_URL must not point to loopback in production; configure the shared production Redis service.")
            if self.database_url.startswith("sqlite"):
                raise ValueError("SQLite is not supported in production; configure PostgreSQL via DATABASE_URL.")
            frontend_lower = self.frontend_url.lower().rstrip("/")
            if any(frontend_lower.startswith(prefix) for prefix in (
                "http://localhost", "http://127.0.0.1", "http://[::1]",
                "https://localhost", "https://127.0.0.1", "https://[::1]",
            )):
                raise ValueError("FRONTEND_URL must point to the real production frontend; loopback URLs are not allowed in production.")
        return self


def get_settings() -> Settings:
    """Get settings with validation."""
    try:
        return Settings()
    except ValidationError as e:
        print("Configuration Error:")
        for error in e.errors():
            print(f"  - {error.get('loc', 'unknown')}: {error.get('msg', 'invalid value')}")
        raise


settings = get_settings()
