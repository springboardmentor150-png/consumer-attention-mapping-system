from urllib.parse import quote_plus
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base

load_dotenv()

password = quote_plus(os.getenv("DATABASE_PASSWORD"))

DATABASE_URL = (
    f"postgresql://{os.getenv('DATABASE_USER')}:"
    f"{password}@"
    f"{os.getenv('DATABASE_HOST')}:"
    f"{os.getenv('DATABASE_PORT')}/"
    f"{os.getenv('DATABASE_NAME')}"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()