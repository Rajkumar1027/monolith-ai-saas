from fastapi.testclient import TestClient
from project.main import app, get_current_user
import io
import json

# Bypass authentication
app.dependency_overrides[get_current_user] = lambda: {"user": "test_user"}
client = TestClient(app)

csv_content = """Feedback
I am absolutely thrilled with this service! Excellent work.
The latency is horrible and the system keeps crashing.
It is okay. Nothing special to report.
"""

file_obj = io.BytesIO(csv_content.encode('utf-8'))

response = client.post("/api/feedback/upload", files={"file": ("test.csv", file_obj, "text/csv")})

print("Status Code:", response.status_code)
print("Response JSON:")
print(json.dumps(response.json(), indent=2))
