import os
import sys
from dotenv import load_dotenv

# Ensure the root folder is in the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

load_dotenv()

def test_migration():
    print("🚀 Running AI Migration Validation Suite...")
    
    try:
        from project.main import call_ai
    except Exception as e:
        print(f"❌ Failed to import call_ai from project.main: {e}")
        sys.exit(1)
        
    print("✅ Successfully imported call_ai.")
    
    test_prompt = "Say 'Groq Integration Successful' and nothing else."
    print(f"📡 Testing call_ai with prompt: '{test_prompt}'")
    
    try:
        response = call_ai(test_prompt)
        print(f"✅ Received response from AI: '{response}'")
        if "Groq" in response or "Successful" in response:
            print("🎉 AI MIGRATION VALIDATION SUCCESSFUL!")
        else:
            print("⚠️ Received response but content was unexpected. Check connectivity or quota.")
    except Exception as e:
        print(f"❌ call_ai failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_migration()
