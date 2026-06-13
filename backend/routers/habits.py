from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime, date

from auth import get_current_user
from database import get_db
from models.habit import (
    HabitCreate, HabitUpdate, HabitResponse,
    HabitWithStatus, HabitCheckRequest, StreakResponse,
)
from services.streak import calculate_streak

router = APIRouter(prefix="/api/habits", tags=["habits"])


def habit_doc_to_response(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "category": doc.get("category", "custom"),
        "reminder_time": doc.get("reminder_time"),
        "repeat_type": doc.get("repeat_type", "daily"),
        "repeat_days": doc.get("repeat_days", []),
        "order": doc.get("order", 0),
        "created_at": doc.get("created_at", datetime.utcnow()),
        "archived": doc.get("archived", False),
    }


def is_habit_scheduled_for(habit_doc: dict, target_date: date) -> bool:
    """Check if habit is scheduled for given date."""
    repeat_type = habit_doc.get("repeat_type", "daily")
    repeat_days = habit_doc.get("repeat_days", [])

    if repeat_type == "daily":
        return True
    elif repeat_type == "specific_days" and repeat_days:
        return target_date.weekday() in repeat_days
    elif repeat_type == "weekly":
        return True
    return True


@router.get("", response_model=list[HabitResponse])
async def list_habits(user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    habits = await db.habits.find({"archived": {"$ne": True}, "user_id": user_id}).sort("order", 1).to_list(length=None)
    return [habit_doc_to_response(h) for h in habits]


@router.post("", response_model=HabitResponse)
async def create_habit(habit: HabitCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    doc = {
        **habit.model_dump(),
        "user_id": user_id,
        "created_at": datetime.utcnow(),
        "archived": False,
    }
    result = await db.habits.insert_one(doc)
    doc["_id"] = result.inserted_id
    return habit_doc_to_response(doc)


@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit(habit_id: str, habit: HabitUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    update_data = {k: v for k, v in habit.model_dump().items() if v is not None}
    await db.habits.update_one({"_id": ObjectId(habit_id), "user_id": user_id}, {"$set": update_data})
    doc = await db.habits.find_one({"_id": ObjectId(habit_id), "user_id": user_id})
    return habit_doc_to_response(doc)


@router.delete("/{habit_id}")
async def delete_habit(habit_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    await db.habits.update_one(
        {"_id": ObjectId(habit_id), "user_id": user_id}, {"$set": {"archived": True}}
    )
    return {"ok": True}


@router.get("/today", response_model=list[HabitWithStatus])
async def get_today_habits(user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    today = date.today()
    today_str = today.isoformat()
    habits = await db.habits.find({"archived": {"$ne": True}, "user_id": user_id}).sort("order", 1).to_list(length=None)

    result = []
    for h in habits:
        if not is_habit_scheduled_for(h, today):
            continue
        hid = str(h["_id"])
        log = await db.habit_logs.find_one({"habit_id": hid, "date": today_str, "user_id": user_id})
        streak_data = await calculate_streak(db, hid, h, user_id)
        resp = habit_doc_to_response(h)
        resp["completed_today"] = log is not None and log.get("completed", False)
        resp["current_streak"] = streak_data["current_streak"]
        result.append(resp)
    return result


@router.post("/{habit_id}/check")
async def check_habit(habit_id: str, req: HabitCheckRequest, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    await db.habit_logs.update_one(
        {"habit_id": habit_id, "date": req.date, "user_id": user_id},
        {"$set": {"completed": True, "completed_at": datetime.utcnow(), "user_id": user_id}},
        upsert=True,
    )
    return {"ok": True}


@router.delete("/{habit_id}/check/{check_date}")
async def uncheck_habit(habit_id: str, check_date: str, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    await db.habit_logs.delete_one({"habit_id": habit_id, "date": check_date, "user_id": user_id})
    return {"ok": True}


@router.get("/{habit_id}/streak", response_model=StreakResponse)
async def get_streak(habit_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    habit_doc = await db.habits.find_one({"_id": ObjectId(habit_id), "user_id": user_id})
    return await calculate_streak(db, habit_id, habit_doc, user_id)


@router.get("/{habit_id}/logs")
async def get_habit_logs(habit_id: str, start: str = "", end: str = "", user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    query = {"habit_id": habit_id, "completed": True, "user_id": user_id}
    if start and end:
        query["date"] = {"$gte": start, "$lte": end}
    logs = await db.habit_logs.find(query).sort("date", 1).to_list(length=None)
    return [{"date": l["date"], "completed": l["completed"]} for l in logs]
