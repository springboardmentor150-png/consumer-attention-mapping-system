import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

def get_database_url():
    """Build and normalize database URL from environment variables."""
    db_url = os.getenv("DATABASE_URL")
    
    # If DB_URL is not set, try constructing from individual PG environment variables
    if not db_url:
        pg_user = os.getenv("POSTGRES_USER")
        pg_password = os.getenv("POSTGRES_PASSWORD")
        pg_host = os.getenv("POSTGRES_HOST", "localhost")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_db = os.getenv("POSTGRES_DB", "consumer_attention")
        
        if pg_user and pg_password:
            db_url = f"postgresql+psycopg2://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_db}"

    if db_url:
        # Standardize PostgreSQL dialect format for SQLAlchemy 2.0+
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg2://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return db_url

    return "sqlite:///./app.db"

target_url = get_database_url()
is_postgres = "postgresql" in target_url

# Attempt connection to target database (PostgreSQL or SQLite)
try:
    if is_postgres:
        logger.info(f"Connecting to PostgreSQL database...")
        # Create test engine with connection pool parameters
        test_engine = create_engine(
            target_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("PostgreSQL database connection established successfully.")
        engine = test_engine
    else:
        logger.info("Using SQLite database.")
        engine = create_engine(
            target_url,
            connect_args={"check_same_thread": False} if "sqlite" in target_url else {},
        )
except OperationalError as err:
    logger.warning(
        f"PostgreSQL connection failed ({err}). Falling back to local SQLite database (app.db)..."
    )
    target_url = "sqlite:///./app.db"
    engine = create_engine("sqlite:///./app.db", connect_args={"check_same_thread": False})
except Exception as err:
    logger.error(f"Database setup warning ({err}). Initializing SQLite fallback...")
    target_url = "sqlite:///./app.db"
    engine = create_engine("sqlite:///./app.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_status():
    """Runtime diagnostic health check for database connection status."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_type = "PostgreSQL" if "postgresql" in str(engine.url) else "SQLite"
        return {
            "status": "Connected",
            "connected": True,
            "database_type": db_type,
            "dialect": engine.dialect.name,
            "url": str(engine.url).split("@")[-1] if "@" in str(engine.url) else str(engine.url),
        }
    except Exception as exc:
        return {
            "status": "Disconnected",
            "connected": False,
            "error": str(exc),
            "database_type": "Unknown",
        }
