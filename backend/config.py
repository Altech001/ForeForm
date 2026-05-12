import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./formflow.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "changeme")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "re_har25VMb_Ggk2z8woA97nWCRq5pa2EZah")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "onboarding@resend.dev")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Google OAuth2 for Drive / Sheets integrations
    GOOGLE_OAUTH_CLIENT_ID: str = os.getenv(
        "GOOGLE_OAUTH_CLIENT_ID",
        "607016949081-pu5rdrdaobgtvgiq8q6omf05thl3avpa.apps.googleusercontent.com",
    )
    GOOGLE_OAUTH_CLIENT_SECRET: str = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
    GOOGLE_OAUTH_REDIRECT_URI: str = os.getenv(
        "GOOGLE_OAUTH_REDIRECT_URI",
        "http://localhost:5173/integrations/google/callback",
    )


settings = Settings()
