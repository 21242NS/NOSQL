
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from flask import Flask, request, jsonify
from bson.objectid import ObjectId

uri = "mongodb://mongo:27017/mygamesdb"
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
app = Flask(__name__)
# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
db = client["mygamesdb"]  # Nom de ta base de données
games_collection = db["games"]  # Nom de ta collection
clients = db["clients"]

@app.route("/api/games", methods=["POST"])
def add_game():
    data = request.json
    game_id = games_collection.insert_one(data).inserted_id
    return jsonify({"_id": str(game_id)}), 201
# Read all
@app.route("/api/games", methods=["GET"])
def get_games():
    games = list(games_collection.find())
    for g in games:
        g["_id"] = str(g["_id"])
    return jsonify(games)

# Read one
@app.route("/api/games/<game_id>", methods=["GET"])
def get_game(game_id):
    game = games_collection.find_one({"_id": ObjectId(game_id)})
    if not game:
        return jsonify({"error": "Game not found"}), 404
    game["_id"] = str(game["_id"])
    return jsonify(game)

# Update
@app.route("/api/games/<game_id>", methods=["PUT"])
def update_game(game_id):
    data = request.json
    result = games_collection.update_one({"_id": ObjectId(game_id)}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Game not found"}), 404
    return jsonify({"message": "Game updated"})

# Delete
@app.route("/api/games/<game_id>", methods=["DELETE"])
def delete_game(game_id):
    result = games_collection.delete_one({"_id": ObjectId(game_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Game not found"}), 404
    return jsonify({"message": "Game deleted"})
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")