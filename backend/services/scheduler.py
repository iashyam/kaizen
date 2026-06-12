from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import date

scheduler = AsyncIOScheduler()


async def send_habit_reminder(time_of_day: str):
    from database import get_db
    from services.push import send_push_notification
    from services.telegram import send_telegram

    db = get_db()
    doc = await db.settings.find_one({"_id": "app_settings"})
    if not doc:
        return

    today_str = date.today().isoformat()
    habits = await db.habits.find({
        "archived": {"$ne": True},
        "category": {"$in": ["morning"] if time_of_day == "morning" else ["evening"]},
    }).to_list(length=None)

    if not habits:
        return

    completed = 0
    for h in habits:
        log = await db.habit_logs.find_one({
            "habit_id": str(h["_id"]), "date": today_str, "completed": True
        })
        if log:
            completed += 1

    remaining = len(habits) - completed
    if remaining == 0:
        return

    msg = f"You have {remaining} {time_of_day} habit{'s' if remaining != 1 else ''} left to complete!"

    if doc.get("push_subscription"):
        try:
            await send_push_notification(doc["push_subscription"], f"{time_of_day.title()} Habits", msg)
        except Exception:
            pass

    if doc.get("telegram_chat_id"):
        try:
            await send_telegram(doc["telegram_chat_id"], msg)
        except Exception:
            pass


async def send_budget_reminder():
    from database import get_db
    from services.budget_calc import get_today_budget
    from services.push import send_push_notification
    from services.telegram import send_telegram

    db = get_db()
    doc = await db.settings.find_one({"_id": "app_settings"})
    if not doc:
        return

    budget = await get_today_budget(db)
    if budget["logged_today"]:
        return

    msg = f"Don't forget to log today's spending! Available budget: {budget['available_budget']} INR"

    if doc.get("push_subscription"):
        try:
            await send_push_notification(doc["push_subscription"], "Budget Reminder", msg)
        except Exception:
            pass

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
