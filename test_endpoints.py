import requests

URL_ANALYZE = "http://localhost:8000/analyze"
URL_HISTORY = "http://localhost:8000/history"
CSV_FILE = "monolith/test_feedback.csv"

def run_test():
    try:
        with open(CSV_FILE, "rb") as f:
            print(f"Uploading {CSV_FILE} to /analyze...")
            files = {"file": (CSV_FILE, f, "text/csv")}
            res = requests.post(URL_ANALYZE, files=files)
            if res.status_code == 200:
                print("Analyze Response:", res.json())
            else:
                print(f"Analyze Failed! Status: {res.status_code}, Response: {res.text}")
    except Exception as e:
        print(f"Failed to upload: {e}")

    print("\nFetching history from MongoDB via /history...")
    try:
        res2 = requests.get(URL_HISTORY)
        print("History Response:", res2.json())
    except Exception as e:
        print(f"Failed to fetch history: {e}")

if __name__ == "__main__":
    run_test()
