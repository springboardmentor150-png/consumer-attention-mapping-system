from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from loguru import logger

class MongoDBManager:
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self.db = None

    def connect(self) -> None:
        """Establish connection to MongoDB."""
        logger.info("Connecting to MongoDB...")
        self.client = AsyncIOMotorClient(settings.MONGO_URL)
        self.db = self.client[settings.MONGO_DB]
        logger.info("MongoDB connection established successfully.")

    def close(self) -> None:
        """Close connection to MongoDB."""
        if self.client:
            logger.info("Closing MongoDB connection...")
            self.client.close()
            logger.info("MongoDB connection closed.")

# Single instance manager
db_mongo = MongoDBManager()

def connect_to_mongo() -> None:
    db_mongo.connect()

def close_mongo_connection() -> None:
    db_mongo.close()

# Collections
def get_attention_collection():
    """Returns the shopper attention events collection."""
    return db_mongo.db["shopper_attention"]

def get_sessions_collection():
    """Returns the shopper session tracking collection."""
    return db_mongo.db["shopper_sessions"]

def get_heatmap_collection():
    """Returns the zone heatmaps collection."""
    return db_mongo.db["zone_heatmaps"]

def get_behavior_collection():
    """Returns the shopper behavior analysis collection."""
    return db_mongo.db["shopper_behavior"]
