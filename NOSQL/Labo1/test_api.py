import requests

BASE = 'http://127.0.0.1:5000'

def test_get():
    r = requests.get(f'{BASE}/games')
    print('GET /games:', r.status_code, r.json())

def test_post():
    r = requests.post(f'{BASE}/games', json={'title': 'Zelda', 'platform': 'Switch'})
    print('POST /games:', r.status_code, r.json())

def test_put(game_id):
    r = requests.put(f'{BASE}/games/{game_id}', json={'title': 'Zelda Updated'})
    print(f'PUT /games/{game_id}:', r.status_code, r.json())

def test_delete(game_id):
    r = requests.delete(f'{BASE}/games/{game_id}')
    print(f'DELETE /games/{game_id}:', r.status_code, r.json())

if __name__ == '__main__':
    test_get()
    test_post()
    test_get()
    test_put(1)
    test_delete(1)
    test_get()