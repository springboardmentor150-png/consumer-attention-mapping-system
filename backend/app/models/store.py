from sqlalchemy import Column, Integer, String

from app.database.database import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column("store_name", String, index=True)
    location = Column(String)

    @property
    def name(self):
        return self.store_name

    @name.setter
    def name(self, value):
        self.store_name = value
