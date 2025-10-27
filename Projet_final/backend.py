import os

from flask import Flask
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import PyMongoError


MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "finance_tracker")

# Flask app initialisation (routes will be added later).
app = Flask(__name__)

# MongoDB connection and basic health check.
try:
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    mongo_client.admin.command("ping")
except PyMongoError as exc:
    raise RuntimeError(f"Connexion MongoDB impossible: {exc}") from exc

mongo_db = mongo_client[MONGO_DB_NAME]

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


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
