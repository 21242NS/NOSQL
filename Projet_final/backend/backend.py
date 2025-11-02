import os
from datetime import datetime
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.server_api import ServerApi
from flask import Flask, request, jsonify
from bson.objectid import ObjectId
from flask_cors import CORS
from cache import get_cache, set_cache, delete_cache
uri = "mongodb://mongo:27017/financialdb"
client = MongoClient(uri, server_api=ServerApi('1'))
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
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


def serialize_user(document):
    if not document:
        return None
    serialized = {}
    for key, value in document.items():
        if key == "_id":
            serialized["_id"] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, ObjectId):
            serialized[key] = str(value)
        else:
            serialized[key] = value
    return serialized


def recalculate_user_totals(user_oid: ObjectId):
    pipeline = [
        {"$match": {"user_id": user_oid}},
        {
            "$group": {
                "_id": {"relation_type": "$relation_type", "type": "$type"},
                "total": {"$sum": {"$cond": [{"$eq": ["$type", "credit"]}, "$amount", {"$multiply": ["$amount", -1]}]}},
            }
        },
    ]
    summary = {"creances": 0.0, "dettes": 0.0}
    for row in transactions_collection.aggregate(pipeline):
        raw_relation_type = row["_id"].get("relation_type")
        if raw_relation_type == "creance":
            relation_type = "creances"
        elif raw_relation_type == "dette":
            relation_type = "dettes"
        else:
            relation_type = raw_relation_type
        flow_type = row["_id"].get("type")
        total = float(row.get("total", 0.0))
        if relation_type not in summary:
            summary[relation_type] = 0.0
        if flow_type == "credit":
            summary[relation_type] += total
        elif flow_type == "debit":
            summary[relation_type] -= total
    creances = summary.get("creances", 0.0)
    dettes = summary.get("dettes", 0.0)
    argent_recolte = creances - dettes
    now = datetime.utcnow()

    users_collection.update_one(
        {"_id": user_oid},
        {
            "$set": {
                "creances": round(creances, 2),
                "dettes": round(dettes, 2),
                "argent_recolte": round(argent_recolte, 2),
                "updated_at": now,
            }
        },
    )

    updated_user = users_collection.find_one({"_id": user_oid})
    delete_cache("users:list")
    delete_cache(f"user:{str(user_oid)}")
    return serialize_user(updated_user)


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
    serialized_users = [serialize_user(user) for user in users]
    set_cache("users:list", serialized_users)
    return jsonify(serialized_users), 200
@app.route("/api/users/<user_id>", methods=["GET"])
def get_user(user_id):
    cached_user = get_cache(f"user:{user_id}")
    if cached_user:
        return jsonify(cached_user), 200
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        serialized_user = serialize_user(user)
        set_cache(f"user:{user_id}", serialized_user)
        return jsonify(serialized_user), 200
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

    if transaction_id:
        updated_user = recalculate_user_totals(user_oid)
    else:
        updated_user = serialize_user(users_collection.find_one({"_id": user_oid}))

    response = {"message": " and ".join(messages), "user": updated_user}
    if transaction_id:
        response["transaction_id"] = transaction_id
    return jsonify(response), 200
@app.route("/api/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    if not ObjectId.is_valid(user_id):
        return jsonify({"error": "Invalid user id"}), 400
    user_oid = ObjectId(user_id)
    result = users_collection.delete_one({"_id": user_oid})
    if result.deleted_count == 0:
        return jsonify({"error": "User not found"}), 404
    delete_cache(f"user:{user_id}")
    delete_cache("users:list")
    return jsonify({"message": "User deleted"}), 200
@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    user_id = request.args.get("user_id")
    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"error": "Invalid or missing user_id parameter"}), 400
    user_oid = ObjectId(user_id)
    transactions = list(transactions_collection.find({"user_id": user_oid}).sort("date", DESCENDING))
    serialized = []
    for transaction in transactions:
        item = {}
        for key, value in transaction.items():
            if key == "_id":
                item["_id"] = str(value)
            elif isinstance(value, datetime):
                item[key] = value.isoformat()
            elif isinstance(value, ObjectId):
                item[key] = str(value)
            else:
                item[key] = value
        serialized.append(item)
    return jsonify(serialized), 200
@app.route("/api/transactions/<transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    if not ObjectId.is_valid(transaction_id):
        return jsonify({"error": "Invalid transaction id"}), 400
    transaction_oid = ObjectId(transaction_id)
    existing = transactions_collection.find_one({"_id": transaction_oid})
    if not existing:
        return jsonify({"error": "Transaction not found"}), 404
    transactions_collection.delete_one({"_id": transaction_oid})
    updated_user = recalculate_user_totals(existing["user_id"])
    return jsonify({"message": "Transaction deleted", "user": updated_user}), 200


@app.route("/api/transactions/<transaction_id>", methods=["PUT"])
def update_transaction(transaction_id):
    if not ObjectId.is_valid(transaction_id):
        return jsonify({"error": "Invalid transaction id"}), 400
    transaction_oid = ObjectId(transaction_id)
    existing = transactions_collection.find_one({"_id": transaction_oid})
    if not existing:
        return jsonify({"error": "Transaction not found"}), 404

    data = request.json or {}
    if "category_id" in data:
        category_id = data["category_id"]
        if category_id and not ObjectId.is_valid(category_id):
            return jsonify({"error": "Invalid category id"}), 400
        data["category_id"] = ObjectId(category_id) if category_id else None

    transactions_collection.update_one({"_id": transaction_oid}, {"$set": data})
    updated_user = recalculate_user_totals(existing["user_id"])
    return jsonify({"message": "Transaction updated", "user": updated_user}), 200
@app.route("/api/categories", methods=["GET"])
def get_categories():
    categories = list(categories_collection.find())
    serialized = []
    for category in categories:
        item = {}
        for key, value in category.items():
            if key == "_id":
                item["_id"] = str(value)
            else:
                item[key] = value
        serialized.append(item)
    return jsonify(serialized), 200
@app.route("/api/categories", methods=["POST"])
def add_category():
    data = request.json
    category_id = categories_collection.insert_one(data).inserted_id
    return jsonify({"_id": str(category_id)}), 201
@app.route("/api/categories/<category_id>", methods=["DELETE"])
def delete_category(category_id):
    if not ObjectId.is_valid(category_id):
        return jsonify({"error": "Invalid category id"}), 400
    category_oid = ObjectId(category_id)
    result = categories_collection.delete_one({"_id": category_oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Category not found"}), 404
    return jsonify({"message": "Category deleted"}), 200
@app.route("/api/categories/<category_id>", methods=["PUT"])
def update_category(category_id):
    if not ObjectId.is_valid(category_id):
        return jsonify({"error": "Invalid category id"}), 400
    category_oid = ObjectId(category_id)
    data = request.json or {}
    result = categories_collection.update_one({"_id": category_oid}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Category not found"}), 404
    return jsonify({"message": "Category updated"}), 200
@app.route("/api/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    if not ObjectId.is_valid(user_id):
        return jsonify({"error": "Invalid user id"}), 400
    user_oid = ObjectId(user_id)
    data = request.json or {}
    result = users_collection.update_one({"_id": user_oid}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404
    delete_cache(f"user:{user_id}")
    delete_cache("users:list")
    return jsonify({"message": "User updated"}), 200
@app.route("/api/reports/generate", methods=["POST"])
def generate_report():
    data = request.json
    user_id = data.get("user_id")
    period_start = data.get("period_start")
    period_end = data.get("period_end")

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"error": "Invalid or missing user_id"}), 400
    user_oid = ObjectId(user_id)

    if not period_start or not period_end:
        return jsonify({"error": "Missing period_start or period_end"}), 400

    transactions = list(
        transactions_collection.find(
            {
                "user_id": user_oid,
                "date": {"$gte": period_start, "$lte": period_end}
            }
        ).sort("date", DESCENDING)
    )

    total_credit = 0.0
    total_debit = 0.0
    for txn in transactions:
        amount = float(txn.get("amount", 0.0))
        if txn.get("type") == "credit":
            total_credit += amount
        elif txn.get("type") == "debit":
            total_debit += amount

    report_data = {
        "user_id": user_oid,
        "period_start": period_start,
        "period_end": period_end,
        "total_credit": round(total_credit, 2),
        "total_debit": round(total_debit, 2),
        "net_balance": round(total_credit - total_debit, 2),
        "generated_at": datetime
    }

    report_id = reports_collection.insert_one(report_data).inserted_id
    return jsonify({"report_id": str(report_id), "report": report_data}), 201
@app.route("/api/reports/<report_id>", methods=["GET"])
def get_report(report_id):
    if not ObjectId.is_valid(report_id):
        return jsonify({"error": "Invalid report id"}), 400
    report_oid = ObjectId(report_id)
    report = reports_collection.find_one({"_id": report_oid})
    if not report:
        return jsonify({"error": "Report not found"}), 404
    serialized_report = {}
    for key, value in report.items():
        if key == "_id":
            serialized_report["_id"] = str(value)
        elif isinstance(value, datetime):
            serialized_report[key] = value.isoformat()
        elif isinstance(value, ObjectId):
            serialized_report[key] = str(value)
        else:
            serialized_report[key] = value
    return jsonify(serialized_report), 200
@app.route("/api/reports", methods=["GET"])
def list_reports():
    reports = list(reports_collection.find().sort("generated_at", DESCENDING))
    serialized_reports = []
    for report in reports:
        item = {}
        for key, value in report.items():
            if key == "_id":
                item["_id"] = str(value)
            elif isinstance(value, datetime):
                item[key] = value.isoformat()
            elif isinstance(value, ObjectId):
                item[key] = str(value)
            else:
                item[key] = value
        serialized_reports.append(item)
    return jsonify(serialized_reports), 200
@app.route("/api/reports/<report_id>", methods=["DELETE"])
def delete_report(report_id):
    if not ObjectId.is_valid(report_id):
        return jsonify({"error": "Invalid report id"}), 400
    report_oid = ObjectId(report_id)
    result = reports_collection.delete_one({"_id": report_oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Report not found"}), 404
    return jsonify({"message": "Report deleted"}), 200



