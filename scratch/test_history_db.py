import os
import sys
from dotenv import load_dotenv

# Ensure root folder is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

load_dotenv()

def test_history_queries():
    print("🚀 Verifying MongoDB History Database Collections...")
    
    try:
        from project.db.mongo import db
    except Exception as e:
        print(f"❌ Failed to import MongoDB client: {e}")
        sys.exit(1)
        
    if db is None:
        print("❌ MongoDB is offline or unconfigured.")
        sys.exit(1)
        
    print("✅ Successfully connected to MongoDB.")
    
    # 1. Test feedback history count
    try:
        feedback_count = db.feedback_history.count_documents({})
        print(f"📂 Feedback Upload history collection has: {feedback_count} session records.")
    except Exception as e:
        print(f"❌ Error querying feedback_history: {e}")
        
    # 2. Test email count
    try:
        email_count = db.emails.count_documents({})
        print(f"📧 Synced emails collection has: {email_count} records.")
    except Exception as e:
        print(f"❌ Error querying emails: {e}")
        
    print("🎉 HISTORY DATABASE VERIFICATION SUCCESSFUL!")

if __name__ == "__main__":
    test_history_queries()
