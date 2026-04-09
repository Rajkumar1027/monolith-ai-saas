import requests
import json

with open("test.csv", "w", encoding="utf-8") as f:
    f.write("feedback,other\n")
    f.write("I am very happy with this product.,1\n")
    f.write("The software crashed yesterday and it is horrible.,2\n")
    f.write("It is okay, nothing special.,3\n")

try:
    with open("test.csv", "rb") as f:
        res = requests.post("http://localhost:8000/api/feedback/upload", files={"file": f})

    print("Status Code:", res.status_code)
    try:
        print("Response JSON:\n", json.dumps(res.json(), indent=2))
    except Exception as e:
        print("Raw text:", res.text)
except Exception as e:
    print("Request failed:", e)
