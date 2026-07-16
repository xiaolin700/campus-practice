from dataclasses import dataclass, field
from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    app_secret: str = os.getenv("APP_SECRET", "change-me-in-production")
    database_path: Path = Path(
        os.getenv("DATABASE_PATH", str(BASE_DIR / "data" / "app.db"))
    )
    frontend_origins: list[str] = field(
        default_factory=lambda: sorted(
            {
                *[
                    origin.strip()
                    for origin in os.getenv(
                        "FRONTEND_ORIGINS",
                        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
                    ).split(",")
                    if origin.strip()
                ],
                "http://localhost:5173",
                "http://localhost:5180",
            }
        )
    )
    token_minutes: int = 60 * 24


settings = Settings()
