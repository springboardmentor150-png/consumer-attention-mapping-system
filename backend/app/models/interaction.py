from sqlalchemy import Column, Integer, String, Float, DateTime

from app.core.database import Base


class CustomerInteraction(Base):
    __tablename__ = "customer_interactions"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(Integer, nullable=False)

    shelf_name = Column(String, nullable=False)

    entry_time = Column(DateTime, nullable=False)

    exit_time = Column(DateTime, nullable=False)

    dwell_time = Column(Float, nullable=False)