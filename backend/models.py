from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship

from database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)

    role = relationship("Role", back_populates="users")

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)

    shelves = relationship(
        "Shelf",
        back_populates="store"
    )


class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(
        Integer,
        ForeignKey("stores.id"),
        nullable=False
    )
    zone_name = Column(String(255), nullable=False)

    store = relationship(
        "Store",
        back_populates="shelves"
    )

class DwellTimeRecord(Base):
    __tablename__ = "dwell_time_records"

    id = Column(Integer, primary_key=True, index=True)

    shopper_id = Column(Integer, nullable=False)

    shelf_id = Column(String, default="Shelf Zone")

    entry_time = Column(DateTime, nullable=False)

    exit_time = Column(DateTime, nullable=False)

    total_dwell_duration = Column(Float, nullable=False)

class AttentionRecord(Base):
    __tablename__ = "attention_records"

    id = Column(Integer, primary_key=True, index=True)

    shopper_id = Column(Integer, nullable=False)

    shelf_id = Column(String, default="Shelf Zone")

    attention_start_time = Column(Float, nullable=False)

    attention_end_time = Column(Float, nullable=False)

    total_attention_duration = Column(Float, nullable=False)

    attention_percentage = Column(Float, nullable=False)
class ShopperSession(Base):
    __tablename__ = "shopper_sessions"

    id = Column(Integer, primary_key=True, index=True)

    shopper_id = Column(Integer, nullable=False)

    entry_time = Column(DateTime, nullable=False)

    exit_time = Column(DateTime, nullable=False)

    total_dwell_time = Column(Float, nullable=False)

    path_length = Column(Float, default=0)

    segment = Column(String(50), default="Unknown")
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    product_name = Column(String(255), nullable=False)

    shelf_id = Column(
        Integer,
        ForeignKey("shelves.id"),
        nullable=False
    )

    views = Column(Integer, default=0)
    pickups = Column(Integer, default=0)
    purchases = Column(Integer, default=0)

    attention_duration = Column(Float, default=0)
    attractiveness_score = Column(Float, default=0)

    shelf = relationship("Shelf")