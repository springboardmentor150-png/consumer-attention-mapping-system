from sqlalchemy import create_engine            #object which establishes comm with db 
from sqlalchemy.orm import declarative_base, sessionmaker #each api its own sesh and base is like blueprint

from app.core.config import DATABASE_URL            #postgre connection

engine = create_engine(DATABASE_URL)

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