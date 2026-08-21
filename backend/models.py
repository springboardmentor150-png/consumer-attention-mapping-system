from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, Float, DateTime

Base = declarative_base()


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String, unique=True, nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"))

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String)
    location = Column(String)


class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"))
    zone_name = Column(String)


class ConsumerTracking(Base):
    __tablename__ = "consumer_tracking"

    id = Column(Integer, primary_key=True, index=True)

    tracker_id = Column(Integer)
    store_id = Column(Integer)
    shelf_id = Column(Integer)

    entry_time = Column(DateTime)
    exit_time = Column(DateTime)

    dwell_time = Column(Float)

    behavior_segment = Column(String, nullable=True)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    product_name = Column(
        String,
        nullable=False
    )

    shelf_id = Column(
        Integer,
        ForeignKey("shelves.id"),
        nullable=False
    )

    store_id = Column(
        Integer,
        ForeignKey("stores.id"),
        nullable=False
    )

class ProductInteraction(Base):
    __tablename__ = "product_interactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    tracker_id = Column(
        Integer,
        nullable=False
    )

    interaction_type = Column(
        String,
        nullable=False
    )

    interaction_time = Column(
        DateTime,
        nullable=False
    )