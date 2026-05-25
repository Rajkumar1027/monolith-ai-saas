from project.db.mongo import users_collection
import os

user = users_collection.find_one({"email": "RAJKUMARPERSONAL18@GMAIL.COM"})
if user:
    print(f"User found: {user.get('email')}")
    print(f"Username in DB: {user.get('username')}")
    # print(f"Password hash starts with: {user.get('password')[:10]}")
else:
    print("User NOT found in database.")

# Also list all users for debugging
print("\nRecent users:")
for u in users_collection.find().limit(5):
    print(f"- {u.get('email')} ({u.get('username')})")
