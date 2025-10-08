import redis
import json

redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

def get_cache(key):
    value = redis_client.get(key)
    if value:
        return json.loads(value)
    return None

def set_cache(key, value, ttl=120):
    redis_client.set(key, json.dumps(value), ex=ttl)

def delete_cache(key):
    redis_client.delete(key)