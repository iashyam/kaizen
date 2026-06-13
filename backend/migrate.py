"""
Migration script: Add user_id to all existing data.

Creates a default user and associates all existing documents with that user.
Run once after deploying multi-user support.

Usage:
    MIGRATE_EMAIL=you@example.com MIGRATE_PASSWORD=yourpass python migrate.py
    # or it will prompt interactively
"""
import asyncio
import os
from datetime import datetime

from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from auth import hash_password


async def migrate():
    email = os.environ.get("MIGRATE_EMAIL") or input("Default user email: ")
    password = os.environ.get("MIGRATE_PASSWORD") or input("Default user password: ")
    name = os.environ.get("MIGRATE_NAME", "Default User")

    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.get_default_database("lifetracker")

    # Check if migration already ran
    sample = await db.habits.find_one({"user_id": {"$exists": True}})
    if sample:
        print("Migration already applied (documents already have user_id). Skipping.")
        client.close()
        return

    # Create default user
    existing_user = await db.users.find_one({"email": email.lower()})
    if existing_user:
        user_id = str(existing_user["_id"])
        print(f"User {email} already exists (id: {user_id})")
    else:
        result = await db.users.insert_one({
            "email": email.lower(),
            "password_hash": hash_password(password),
            "name": name,
            "created_at": datetime.utcnow(),
        })
        user_id = str(result.inserted_id)
        print(f"Created user {email} (id: {user_id})")

    # Add user_id to all collections
    collections = ["habits", "habit_logs", "todos", "budget_logs", "challenges"]
    for col_name in collections:
        result = await db[col_name].update_many(
            {"user_id": {"$exists": False}},
            {"$set": {"user_id": user_id}},
        )
        print(f"  {col_name}: updated {result.modified_count} documents")

    # Convert singleton settings to per-user settings
    old_settings = await db.settings.find_one({"_id": "app_settings"})
    if old_settings:
        old_settings.pop("_id")
        old_settings["user_id"] = user_id
        # Check if per-user settings already exist
        existing = await db.settings.find_one({"user_id": user_id})
        if existing:
            await db.settings.update_one(
                {"user_id": user_id},
                {"$set": {k: v for k, v in old_settings.items() if k != "user_id"}},
            )
        else:
            await db.settings.insert_one(old_settings)
        await db.settings.delete_one({"_id": "app_settings"})
        print("  settings: converted singleton to per-user doc")
    else:
        # Create default settings if none exist
        existing = await db.settings.find_one({"user_id": user_id})
        if not existing:
            await db.settings.insert_one({
                "user_id": user_id,
                "daily_allowance": 500,
                "monthly_reset_day": 1,
                "telegram_chat_id": "",
                "timezone": "Asia/Kolkata",
            })
            print("  settings: created default per-user settings")

    print("\nMigration complete!")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
