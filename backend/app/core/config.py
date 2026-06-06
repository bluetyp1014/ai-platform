import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

MONGODB_URL = os.getenv(
    "MONGODB_URL",
    "mongodb://admin:password@localhost:27017/?authSource=admin",
)
MONGODB_DB = os.getenv("MONGODB_DB", "ai_platform")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

REFRESH_COOKIE_NAME = os.getenv("REFRESH_COOKIE_NAME", "ai_platform_refresh_token")
COOKIE_PATH = os.getenv("COOKIE_PATH", "/")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "none")
