import os
from datetime import datetime
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
mongo_db = client["financialdb"]
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
@app.route("/api/users", methods=["GET"])
def get_users():
    cached_users = get_cache("users:list")
    if cached_users:
        return jsonify(cached_users), 200
    users = list(users_collection.find())
    for user in users:
        user["_id"] = str(user["_id"])
    set_cache("users:list", users)
    return jsonify(users), 200
@app.route("/api/users/<user_id>", methods=["GET"])
def get_user(user_id):
    cached_user = get_cache(f"user:{user_id}")
    if cached_user:
        return jsonify(cached_user), 200
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
        set_cache(f"user:{user_id}", user)
        return jsonify(user), 200
    return jsonify({"error": "User not found"}), 404
@app.route("/api/users/<user_id>/transaction", methods=["PUT"])
def update_user_dept(user_id):
    payload = request.json or {}

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid payload format"}), 400

    if not ObjectId.is_valid(user_id):
        return jsonify({"error": "Invalid user id"}), 400

    user_oid = ObjectId(user_id)
    transaction_data = payload.pop("transaction", None)
    if transaction_data and not isinstance(transaction_data, dict):
        return jsonify({"error": "Invalid transaction format"}), 400
    user_update_data = payload

    if not user_update_data and not transaction_data:
        return jsonify({"error": "No update data supplied"}), 400

    user_exists = users_collection.find_one({"_id": user_oid})
    if not user_exists:
        return jsonify({"error": "User not found"}), 404

    if user_update_data:
        users_collection.update_one({"_id": user_oid}, {"$set": user_update_data})

    transaction_id = None
    if transaction_data:
        transaction_document = {key: value for key, value in transaction_data.items() if key != "_id"}
        transaction_document["user_id"] = user_oid

        category_id = transaction_document.get("category_id")
        if category_id:
            if not ObjectId.is_valid(category_id):
                return jsonify({"error": "Invalid category id"}), 400
            transaction_document["category_id"] = ObjectId(category_id)

        if "date" not in transaction_document or not transaction_document["date"]:
            transaction_document["date"] = datetime.utcnow().isoformat() + "Z"

        transaction_id = str(transactions_collection.insert_one(transaction_document).inserted_id)

    delete_cache(f"user:{user_id}")
    delete_cache("users:list")

    messages = []
    if user_update_data:
        messages.append("User debt updated")
    if transaction_id:
        messages.append("Transaction recorded")

    response = {"message": " and ".join(messages)}
    if transaction_id:
        response["transaction_id"] = transaction_id
    return jsonify(response), 200
