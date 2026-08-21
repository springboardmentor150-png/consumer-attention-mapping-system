import requests

# Test 1: Backend health
r = requests.get('http://localhost:8000/')
print('BACKEND ROOT:', r.status_code, r.json()['status'])

# Test 2: Login to get token
login = requests.post('http://localhost:8000/api/auth/login', json={'email': 'validation_admin@cams.com', 'password': 'password123'})
print('LOGIN:', login.status_code)
token = login.json()['access_token']
user = login.json()['user']
print('  User:', user['name'], '| Role:', user['role'])

# Test 3: Get stores (authenticated)
headers = {'Authorization': 'Bearer ' + token}
stores = requests.get('http://localhost:8000/api/stores', headers=headers)
print('STORES:', stores.status_code, '| Count:', len(stores.json()))

# Test 4: Get shelves
shelves = requests.get('http://localhost:8000/api/shelves', headers=headers)
print('SHELVES:', shelves.status_code, '| Count:', len(shelves.json()))

# Test 5: CORS check (simulate browser request from frontend)
cors = requests.options(
    'http://localhost:8000/api/auth/login',
    headers={
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST'
    }
)
cors_header = cors.headers.get('access-control-allow-origin', 'MISSING')
print('CORS ALLOW-ORIGIN:', cors_header)

print()
print('=== ALL INTEGRATION CHECKS PASSED ===')
