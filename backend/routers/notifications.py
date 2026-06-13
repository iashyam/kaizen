from fastapi import APIRouter, Depends

from auth import get_current_user
from database import get_db
from config import settings

router = APIRouter(prefix="/api", tags=["notifications"])


@router.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    doc = await db.settings.find_one({"user_id": user_id})
    if not doc:
        return {
            "daily_allowance": 500,
            "monthly_reset_day": 1,
            "telegram_chat_id": "",
            "timezone": "Asia/Kolkata",
        }
    doc.pop("_id", None)
    doc.pop("user_id", None)
    doc.pop("push_subscription", None)
    return doc


@router.put("/settings")
async def update_settings(data: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    await db.settings.update_one(
        {"user_id": user_id},
        {"$set": data},
        upsert=True,
    )
    return {"ok": True}


@router.post("/notifications/push/subscribe")
async def push_subscribe(subscription: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    await db.settings.update_one(
        {"user_id": user_id},
        {"$set": {"push_subscription": subscription}},
        upsert=True,
    )
    return {"ok": True}


@router.get("/vapid-public-key")
async def vapid_public_key():
    return {"public_key": settings.vapid_public_key}


@router.post("/notifications/test")
async def test_notification(user: dict = Depends(get_current_user)):
    from services.push import send_push_notification
    from services.telegram import send_telegram

    db = get_db()
    user_id = user["_id"]
    doc = await db.settings.find_one({"user_id": user_id})

    results = {}

    if doc and doc.get("push_subscription"):
        try:
            await send_push_notification(
                doc["push_subscription"],
                "Test Notification",
                "Life Tracker notifications are working!",
            )
            results["push"] = "sent"
        except Exception as e:
            results["push"] = f"error: {str(e)}"
    else:
        results["push"] = "no subscription"

    if doc and doc.get("telegram_chat_id"):
        try:
            await send_telegram(
                doc["telegram_chat_id"],
                "Life Tracker: Test notification working!",
            )
            results["telegram"] = "sent"
        except Exception as e:
            results["telegram"] = f"error: {str(e)}"
    else:
        results["telegram"] = "no chat_id configured"

    return results
