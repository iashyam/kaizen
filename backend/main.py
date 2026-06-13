from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId

from auth import get_current_user
from database import connect_db, close_db, get_db
from routers import habits, budget, notifications, todos, challenges, auth
from services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    start_scheduler()
    yield
    stop_scheduler()
    await close_db()


app = FastAPI(title="Life Tracker", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(habits.router)
app.include_router(budget.router)
app.include_router(notifications.router)
app.include_router(todos.router)
app.include_router(challenges.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


class ReorderItem(BaseModel):
    type: str  # "habit" or "todo"
    id: str
    order: int


@app.post("/api/reorder")
async def reorder(items: list[ReorderItem], user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    for item in items:
        collection = db.habits if item.type == "habit" else db.todos
        await collection.update_one(
            {"_id": ObjectId(item.id), "user_id": user_id},
            {"$set": {"order": item.order}},
        )
    return {"ok": True}
