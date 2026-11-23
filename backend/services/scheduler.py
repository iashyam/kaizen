from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Asia/Kolkata")
scheduler = AsyncIOScheduler(timezone=TZ)


async def send_habit_reminder(time_of_day: str):
    from database import get_db
    from services.push import push_to_user_doc
    from services.telegram import send_telegram

    db = get_db()
    today_str = datetime.now(TZ).date().isoformat()

    # Iterate all users' settings
    async for doc in db.settings.find({}):
        user_id = doc.get("user_id")
        if not user_id:
            continue

        habits = await db.habits.find({
            "archived": {"$ne": True},
            "category": {"$in": ["morning"] if time_of_day == "morning" else ["evening"]},
            "user_id": user_id,
        }).to_list(length=None)

        if not habits:
            continue

        completed = 0
        for h in habits:
            log = await db.habit_logs.find_one({
                "habit_id": str(h["_id"]), "date": today_str, "completed": True, "user_id": user_id
            })
            if log:
                completed += 1

        remaining = len(habits) - completed
        if remaining == 0:
            continue

        msg = f"You have {remaining} {time_of_day} habit{'s' if remaining != 1 else ''} left to complete!"

        await push_to_user_doc(db, doc, f"{time_of_day.title()} Habits", msg)

        if doc.get("telegram_chat_id"):
            try:
                await send_telegram(doc["telegram_chat_id"], msg)
            except Exception:
                pass


async def send_budget_reminder():
    from database import get_db
    from services.budget_calc import get_today_budget
    from services.push import push_to_user_doc
    from services.telegram import send_telegram

    db = get_db()

    async for doc in db.settings.find({}):
        user_id = doc.get("user_id")
        if not user_id:
            continue

        budget = await get_today_budget(db, user_id)
        if budget["logged_today"]:
            continue

        msg = f"Don't forget to log today's spending! Available budget: {budget['available_budget']} INR"

        await push_to_user_doc(db, doc, "Budget Reminder", msg)

        if doc.get("telegram_chat_id"):
            try:
                await send_telegram(doc["telegram_chat_id"], msg)
            except Exception:
                pass


def start_scheduler():
    scheduler.add_job(
        send_habit_reminder, CronTrigger(hour=7, minute=0),
        args=["morning"], id="morning_reminder", replace_existing=True,
    )
    scheduler.add_job(
        send_habit_reminder, CronTrigger(hour=21, minute=0),
        args=["evening"], id="evening_reminder", replace_existing=True,
    )
    scheduler.add_job(
        send_budget_reminder, CronTrigger(hour=21, minute=0),
        id="budget_reminder", replace_existing=True,
    )
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown(wait=False)
