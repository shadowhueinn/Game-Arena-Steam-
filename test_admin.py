#!/usr/bin/env python
import requests
import json

# Create a session that persists cookies
session = requests.Session()

# Test 1: Login as admin
print('=== TEST 1: Login as admin ===')
login_response = session.post('http://127.0.0.1:5000/api/login', json={
    'userName': 'admin',
    'pw': 'admin123'
})
print(f'Login Status: {login_response.status_code}')
print(f'Login Response: {login_response.json()}')
print(f'Session Cookies: {dict(session.cookies)}')

# Test 2: Call admin stats endpoint
print('\n=== TEST 2: Get admin stats ===')
stats_response = session.get('http://127.0.0.1:5000/api/admin/stats')
print(f'Stats Status: {stats_response.status_code}')
print(f'Stats Response: {stats_response.json()}')

# Test 3: Get admin users
print('\n=== TEST 3: Get admin users ===')
users_response = session.get('http://127.0.0.1:5000/api/admin/users')
print(f'Users Status: {users_response.status_code}')
users_data = users_response.json()
if isinstance(users_data, list):
    print(f'Number of users: {len(users_data)}')
    if len(users_data) > 0:
        print(f'First user: {users_data[0]}')
else:
    print(f'Response: {users_data}')

print('\n=== DONE ===')
