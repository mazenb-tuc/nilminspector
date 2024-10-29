import os

from redis import asyncio as aioredis
from redis.asyncio.client import Redis as AsyncRedisClient
from redis.client import Redis as RedisClient
from redis import Redis
from dotenv import load_dotenv

load_dotenv()

# Redis
redist_port = os.environ["REDIS_PORT"]
redis_url: str = "redis://localhost:" + redist_port
redis_client: RedisClient = Redis.from_url(redis_url)
async_redis_client: AsyncRedisClient = aioredis.from_url(redis_url, decode_responses=True)


async def get_async_redis() -> AsyncRedisClient:
    return async_redis_client
