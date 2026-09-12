"""Redis caching layer for performance optimization."""

import json
from typing import Optional, Any
import redis
from app.config import settings


class CacheManager:
    """Redis cache manager for caching frequently accessed data."""
    
    def __init__(self):
        self.redis_client = None
        if settings.enable_cache:
            try:
                self.redis_client = redis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_timeout=5,
                    socket_connect_timeout=5
                )
                # Test connection
                self.redis_client.ping()
            except Exception as e:
                print(f"Redis connection failed: {e}")
                self.redis_client = None
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.redis_client:
            return None
        try:
            value = self.redis_client.get(key)
            if value is not None:
                return json.loads(value)
            return None
        except Exception:
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL."""
        if not self.redis_client:
            return False
        try:
            ttl = ttl or settings.redis_cache_ttl
            serialized = json.dumps(value)
            return self.redis_client.setex(key, ttl, serialized)
        except Exception:
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.redis_client:
            return False
        try:
            return self.redis_client.delete(key) > 0
        except Exception:
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete keys matching pattern."""
        if not self.redis_client:
            return 0
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception:
            return 0
    
    def clear(self) -> bool:
        """Clear all cache."""
        if not self.redis_client:
            return False
        try:
            return self.redis_client.flushdb()
        except Exception:
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        if not self.redis_client:
            return False
        try:
            return self.redis_client.exists(key) > 0
        except Exception:
            return False


# Global cache manager instance
cache_manager = CacheManager()


def cache_key(prefix: str, *args) -> str:
    """Generate a cache key from prefix and arguments."""
    key_parts = [prefix] + [str(arg) for arg in args]
    return ":".join(key_parts)


# Cache decorators
def cached(ttl: Optional[int] = None, key_prefix: str = ""):
    """Decorator to cache function results."""
    def decorator(func):
        from functools import wraps

        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate a deterministic cache key without shadowing the helper.
            generated_key = cache_key(key_prefix or func.__name__, *args, str(sorted(kwargs.items())))

            cached_value = cache_manager.get(generated_key)
            if cached_value is not None:
                return cached_value

            result = func(*args, **kwargs)
            cache_manager.set(generated_key, result, ttl)
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str) -> int:
    """Invalidate cache keys matching pattern."""
    return cache_manager.delete_pattern(pattern)
