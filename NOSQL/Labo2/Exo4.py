
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from flask import Flask, request, jsonify
from bson.objectid import ObjectId
import redis
from cache import get_cache, set_cache, delete_cache
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
uri = "mongodb://mongo:27017/mygamesdb"

client = MongoClient(uri, server_api=ServerApi('1'))
app = Flask(__name__)

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
db = client["mygamesdb"]  
games_collection = db["games"]  
clients = db["clients"]



@app.route("/api/games", methods=["POST"])
def add_game():
    data = request.json
    game_id = games_collection.insert_one(data).inserted_id
    delete_cache("games:list")  # Invalide le cache de la liste
    return jsonify({"_id": str(game_id)}), 201

@app.route("/api/games", methods=["GET"])
def get_games():
    cache_key = "games:list"
    cached = get_cache(cache_key)
    if cached:
        return jsonify(cached)
    games = list(games_collection.find())
    for g in games:
        g["_id"] = str(g["_id"])
    set_cache(cache_key, games)
    return jsonify(games)

@app.route("/api/games/<game_id>", methods=["GET"])
def get_game(game_id):
    cache_key = f"game:{game_id}"
    cached = get_cache(cache_key)
    if cached:
        return jsonify(cached)
    game = games_collection.find_one({"_id": ObjectId(game_id)})
    if not game:
        return jsonify({"error": "Game not found"}), 404
    game["_id"] = str(game["_id"])
    set_cache(cache_key, game)
    return jsonify(game)

@app.route("/api/games/<game_id>", methods=["PUT"])
def update_game(game_id):
    data = request.json
    result = games_collection.update_one({"_id": ObjectId(game_id)}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Game not found"}), 404
    delete_cache("games:list")
    delete_cache(f"game:{game_id}")
    return jsonify({"message": "Game updated"})

@app.route("/api/games/<game_id>", methods=["DELETE"])
def delete_game(game_id):
    result = games_collection.delete_one({"_id": ObjectId(game_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Game not found"}), 404
    delete_cache("games:list")
    delete_cache(f"game:{game_id}")
    return jsonify({"message": "Game deleted"})

# ...existing code...
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")