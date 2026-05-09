import httpx
import json

def test_login():
    url = "http://localhost:8000/auth/login"
    payload = {
        "email": "test@example.com",
        "password": "Password123!"
    }
    
    print(f"Sending login request to {url}...")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
