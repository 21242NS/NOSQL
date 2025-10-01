import requests

BASE = "http://127.0.0.1:5000/api/games"

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
    r = requests.get(BASE)
    print("GET ALL:", r.status_code, r.json())

def test_get_one(game_id):
    r = requests.get(f"{BASE}/{game_id}")
    print("GET ONE:", r.status_code, r.json())

def test_put(game_id):
    data = {"price": 49.99, "quantity": 5}
    r = requests.put(f"{BASE}/{game_id}", json=data)
    print("PUT:", r.status_code, r.json())

def test_delete(game_id):
    r = requests.delete(f"{BASE}/{game_id}")
    print("DELETE:", r.status_code, r.json())

if __name__ == "__main__":
    game_id = test_post()
    test_get_all()
    if game_id:
        test_get_one(game_id)
        test_put(game_id)
        test_get_one(game_id)
        # test_delete(game_id)
        test_get_all()