from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)
DATA_FILE = 'Labo1/games.json'

def load_games():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_games(games):
    with open(DATA_FILE, 'w') as f:
        json.dump(games, f, indent=2)

@app.route('/games', methods=['GET'])
def get_games():
    games = load_games()
    return jsonify(games), 200

@app.route('/games', methods=['POST'])
def add_game():
    games = load_games()
    data = request.get_json()
    if not data or 'title' not in data or 'platform' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    new_id = max([g['id'] for g in games], default=0) + 1
    game = {
        'id': new_id,
        'title': data['title'],
        'platform': data['platform']
    }
    games.append(game)
    save_games(games)
    return jsonify(game), 201

@app.route('/games/<int:game_id>', methods=['PUT'])
def update_game(game_id):
    games = load_games()
    data = request.get_json()
    for game in games:
        if game['id'] == game_id:
            game['title'] = data.get('title', game['title'])
            game['platform'] = data.get('platform', game['platform'])
            save_games(games)
            return jsonify(game), 200
    return jsonify({'error': 'Game not found'}), 404

@app.route('/games/<int:game_id>', methods=['DELETE'])
def delete_game(game_id):
    games = load_games()
    for i, game in enumerate(games):
        if game['id'] == game_id:
            deleted = games.pop(i)
            save_games(games)
            return jsonify(deleted), 200
    return jsonify({'error': 'Game not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)