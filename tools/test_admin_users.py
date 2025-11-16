import requests
import json

session = requests.Session()
url_base = 'http://127.0.0.1:5000'

print('Logging in as admin...')
resp = session.post(url_base + '/api/login', json={'userName':'admin','pw':'admin123'})
print('Login status:', resp.status_code)
print('Login body:', resp.text)
print('Session cookies:', session.cookies.get_dict())

print('\nRequesting /api/admin/users...')
resp2 = session.get(url_base + '/api/admin/users')
print('Users status:', resp2.status_code)
try:
    print('Users body:', json.dumps(resp2.json(), indent=2))
except Exception:
    print('Users body (raw):', resp2.text)
