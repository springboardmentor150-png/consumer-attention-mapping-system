from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, nullable=False, index=True)

    password_hash = Column(String, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)

    role_id = Column(Integer, ForeignKey("roles.id"))

    role = relationship("Role", back_populates="users")