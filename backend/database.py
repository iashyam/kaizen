from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client: AsyncIOMotorClient|None = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.get_default_database("lifetracker")
    await db.habit_logs.create_index(
        [("habit_id", 1), ("date", 1)], unique=True
    )
    await db.budget_logs.create_index("date", unique=True)
    await db.todos.create_index("due_date")


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return db
