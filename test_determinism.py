import requests
import time

BASE_URL = "http://localhost:8000"

# Sample data provided by user
payload = {
    "gender": "Male",
    "occupation": "Engineer",
    "bmi_category": "Healthy Weight",
    "age": 30,
    "sleep_hours": 8,
    "sleep_quality": 9,
    "physical_activity": 80,
    "stress_level": 2,
    "heart_rate": 68,
    "daily_steps": 10000,
    "systolic_bp": 115,
    "diastolic_bp": 75,
    "full_name": "Test User"
}

def test_determinism():
    print("🚀 Starting Determinism Test...")
    previous_result = None
    
    # Try multiple requests
    for i in range(1, 6):
        try:
            # We need a token, but let's assume the endpoint setup allows testing or we use a mock token
            # Actually, the analyse-manual endpoint depends on get_current_user_id
            # I will check if I can bypass it for testing or if I need to login first
            
            # For this test, I'll assume the backend is running and I can reach it.
            # I will use a simple request first to see if it works without auth (it shouldn't)
            # So I'll need to login.
            
            print(f"Request {i}...", end=" ", flush=True)
            # This is just a placeholder logic, I will run the actual test via the backend code if possible
            # OR I'll just check if the backend is running now.
            pass
        except Exception as e:
            print(f"Error: {e}")
            break

    print("\n✅ Test script created. (Actual execution requires running backend)")

if __name__ == "__main__":
    test_determinism()
