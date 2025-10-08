import requests
import time

import os
BASE = os.getenv("BASE", "http://flask-app:5000/api/games")

def test_post():
    data = {
        "title": "The Legend of Zelda",
        "genre": "Adventure",
        "release_year": 2017,
        "platforms": ["Nintendo Switch"],
        "price": 59.99,
        "quantity": 10
    }
    r = requests.post(BASE, json=data)
    print("POST:", r.status_code)
    try:
        print(r.json())
        return r.json().get("_id")
    except Exception:
        print("Raw response:", r.text)
        return None

def test_get_all():
    start = time.time()
    r = requests.get(BASE)
    elapsed = time.time() - start
    print(f"GET ALL: {r.status_code} {r.json()} (time: {elapsed:.4f}s)")

def test_get_one(game_id):
    start = time.time()
    r = requests.get(f"{BASE}/{game_id}")
    elapsed = time.time() - start
    print(f"GET ONE: {r.status_code} {r.json()} (time: {elapsed:.4f}s)")

def test_put(game_id):
    data = {"price": 49.99, "quantity": 5}
    r = requests.put(f"{BASE}/{game_id}", json=data)
    print("PUT:", r.status_code, r.json())

def test_delete(game_id):
    r = requests.delete(f"{BASE}/{game_id}")
    print("DELETE:", r.status_code, r.json())

if __name__ == "__main__":
    game_id = test_post()
    test_get_all()      # 1ère requête (cache miss)
    test_get_all()      # 2ème requête (cache hit, plus rapide)
    if game_id:
        test_get_one(game_id)  # 1ère requête (cache miss)
        test_get_one(game_id)  # 2ème requête (cache hit, plus rapide)
        test_put(game_id)      # modifie le jeu, invalide le cache
        test_get_one(game_id)  # cache miss après update
        test_get_all()         # cache miss après update