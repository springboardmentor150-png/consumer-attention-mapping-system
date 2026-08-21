import redis.asyncio as redis
from app.core.config import settings
from loguru import logger
import json
from typing import Optional, Any

class RedisClient:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None

    async def connect(self) -> None:
        """Establish asynchronous connection to Redis."""
        try:
            logger.info("Connecting to Redis...")
            self.redis_client = redis.from_url(
                settings.REDIS_URL, decode_responses=True, socket_timeout=2.0, socket_connect_timeout=2.0
            )
            await self.redis_client.ping()
            logger.info("Redis connection established successfully.")
        except Exception as e:
            logger.warning(f"Redis not available, running without cache: {e}")
            self.redis_client = None

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self.redis_client:
            logger.info("Closing Redis connection...")
            await self.redis_client.close()
            logger.info("Redis connection closed.")

    async def get(self, key: str) -> Optional[str]:
        """Get a value from Redis cache."""
        if not self.redis_client:
            return None
        return await self.redis_client.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """Set a value in Redis cache with an optional expiration time in seconds."""
        if not self.redis_client:
            return False
        return await self.redis_client.set(key, value, ex=ex)

    async def delete(self, key: str) -> int:
        """Delete a key from Redis cache."""
        if not self.redis_client:
            return 0
        return await self.redis_client.delete(key)

    async def publish(self, channel: str, message: str) -> int:
        """Publish a message to a Redis Pub/Sub channel."""
        if not self.redis_client:
            return 0
        return await self.redis_client.publish(channel, message)

    # Cache helper methods
    async def get_session_data(self, session_id: str) -> Optional[dict]:
        """Retrieve tracking session data from cache."""
        data = await self.get(f"session:{session_id}")
        if data:
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                pass
        return None

    async def set_session_data(self, session_id: str, data: dict, ex: int = 3600) -> bool:
        """Cache tracking session data with a default 1-hour expiration."""
        return await self.set(f"session:{session_id}", json.dumps(data), ex=ex)

# Single global instance
redis_client = RedisClient()
