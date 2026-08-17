from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy import Float, DateTime
from database import Base
from datetime import datetime


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    password_hash = Column(String)
    role_id = Column(Integer, ForeignKey("roles.id"))


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String)
    location = Column(String)


class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)

    store_id = Column(
        Integer,
        ForeignKey("stores.id")
    )

    shelf_name = Column(String)

    zone_name = Column(String)

    zone_coordinates = Column(String)

class AttentionLog(Base):

    __tablename__ = "attention_logs"

    id = Column(Integer, primary_key=True, index=True)

    shopper_id = Column(Integer)

    store_id = Column(Integer)

    shelf_id = Column(Integer)

    entry_time = Column(DateTime)

    exit_time = Column(DateTime)

    dwell_time = Column(Float)

class ShelfAnalytics(Base):
    __tablename__ = "shelf_analytics"

    id = Column(Integer, primary_key=True, index=True)

    shopper_id = Column(Integer)

    shelf_id = Column(Integer)

    shelf_name = Column(String)

    attention_time = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)

    recommendation = Column(String)

    attractiveness_score = Column(Float)

    

class ShopperSession(Base):
    __tablename__ = "shopper_sessions"

    id = Column(Integer, primary_key=True, index=True)

    shopper_id = Column(Integer)

    total_attention = Column(Float)

    path_length = Column(Float)

    gaze_changes = Column(Integer)

    segment = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)