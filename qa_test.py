import requests
import json

BASE = "http://localhost:8000"

def test_endpoints():
    print(f"--- Testing {BASE} ---")
    
    # Test 1: Health
    try:
        r = requests.get(f"{BASE}/health", timeout=10)
        print(f"Health: {r.status_code} {r.json()}")
    except Exception as e:
        print(f"Health: FAILED - {e}")

    # Test 2: Register
    try:
        r = requests.post(f"{BASE}/register", json={
            "username": "qa_tester",
            "email": "qa_test@monolith.ai",
            "password": "TestPassword123!"
        }, timeout=10)
        data = r.json()
        print(f"Register: {r.status_code} {data.get('message', 'No message')}")
    except Exception as e:
        print(f"Register: FAILED - {e}")

    # Test 3: Login
    try:
        r = requests.post(f"{BASE}/login", json={
            "email": "qa_test@monolith.ai",
            "password": "TestPassword123!"
        }, timeout=10)
        data = r.json()
        print(f"Login: {r.status_code} {data.get('message', 'No message')}")
        if "access_token" in data:
            print("  ✅ access_token found")
        else:
            print("  ❌ access_token NOT found")
    except Exception as e:
        print(f"Login: FAILED - {e}")

    # Test 4: Real User Login (Optional/Informational)
    try:
        r = requests.post(f"{BASE}/login", json={
            "email": "rajkumarpersonal18@gmail.com",
            "password": "Monolith@123"
        }, timeout=10)
        print(f"Real Login: {r.status_code} {r.json()}")
    except Exception as e:
        print(f"Real Login: FAILED - {e}")

if __name__ == "__main__":
    test_endpoints()
