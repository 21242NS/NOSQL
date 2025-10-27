import os
from pymongo.mongo_client import ASCENDING, DESCENDING, MongoClient
from pymongo.server_api import ServerApi
from flask import Flask, request, jsonify
from bson.objectid import ObjectId
import redis
from cache import get_cache, set_cache, delete_cache
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
uri = "mongodb://mongo:27017/financialdb"
client = MongoClient(uri, server_api=ServerApi('1'))
app = Flask(__name__)
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
mongo_db = mongo_client["financialdb"]
# Collections according to the schema definition.
users_collection = mongo_db["users"]
transactions_collection = mongo_db["transactions"]
categories_collection = mongo_db["categories"]
admins_collection = mongo_db["admins"]
reports_collection = mongo_db["reports"]
notifications_collection = mongo_db["notifications"]
# Indexes to support lookups and constraints.
users_collection.create_index("email", unique=True)
transactions_collection.create_index([("user_id", ASCENDING), ("date", DESCENDING)])
transactions_collection.create_index("category_id")
categories_collection.create_index("name", unique=True)
admins_collection.create_index("username", unique=True)
reports_collection.create_index([("period_start", ASCENDING), ("period_end", ASCENDING)])
notifications_collection.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])

@app.route("/api/users", methods=["POST"])
def add_user():
    data = request.json
    user_id = users_collection.insert_one(data).inserted_id
    delete_cache("users:list")  # Invalidate the cache for the user list
    return jsonify({"_id": str(user_id)}), 201

