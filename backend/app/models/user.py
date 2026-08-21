from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, nullable=False)

    email = Column(String, unique=True, nullable=False)

    mobile_number = Column(String(10), unique=True, nullable=False)

    password = Column(String, nullable=False)

    role_id = Column(Integer, ForeignKey("roles.id"))

    role = relationship("Role")