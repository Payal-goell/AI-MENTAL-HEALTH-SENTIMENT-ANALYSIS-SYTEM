import requests
import json
import sys

# Ensure UTF-8 output even on Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

BASE_URL = "http://localhost:8000/auth"

def test_registration():
    print("--- Testing Registration Endpoint ---")
    
    # Generate unique email to avoid "already exists" error
    import time
    email = f"test_{int(time.time())}@example.com"
    
    payload = {
        "full_name": "Test User",
        "age": 25,
        "gender": "Male",
        "occupation": "Student",
        "phone": "1234567890",
        "location": "Test City",
        "email": email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    
    def run_test(name, cur_payload):
        print(f"\n- Testing: {name}")
        try:
            response = requests.post(f"{BASE_URL}/register", json=cur_payload)
            print(f"Status: {response.status_code}")
            try:
                print(f"Response: {response.json()}")
            except:
                print(f"Response (text): {response.text[:200]}")
            return response
        except Exception as ex:
            print(f"Connection Error: {ex}")
            return None

    # 1. Success
    res = run_test("Successful Registration", payload)
    if res and res.status_code == 200: print("[X] PASS")
    else: print("[ ] FAIL")

    # 2. Duplicate
    res = run_test("Duplicate Email Registration", payload)
    if res and res.status_code == 400 and "already registered" in res.text: print("[X] PASS")
    else: print("[ ] FAIL")

    # 3. Mismatch
    mismatch_payload = payload.copy()
    mismatch_payload["email"] = f"mismatch_{int(time.time())}@example.com"
    mismatch_payload["confirm_password"] = "WrongPassword123!"
    res = run_test("Password Mismatch", mismatch_payload)
    if res and res.status_code == 400 and "match" in res.text: print("[X] PASS")
    else: print("[ ] FAIL")

    # 4. Invalid Age
    invalid_age_payload = payload.copy()
    invalid_age_payload["email"] = f"age_{int(time.time())}@example.com"
    invalid_age_payload["age"] = 5
    res = run_test("Invalid Age (Validation Error)", invalid_age_payload)
    if res and res.status_code == 422: print("[X] PASS")
    else: print("[ ] FAIL")

if __name__ == "__main__":
    test_registration()
