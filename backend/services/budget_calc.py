from datetime import date


async def get_today_budget(db) -> dict:
    settings = await db.settings.find_one({"_id": "app_settings"})
    daily_allowance = settings["daily_allowance"] if settings else 500

    today = date.today()

    # Use last_budget_reset date instead of auto monthly reset
    reset_str = settings.get("last_budget_reset") if settings else None
    if reset_str:
        reset_date = date.fromisoformat(reset_str)
    else:
        reset_date = today.replace(day=1)

    days_since_reset = (today - reset_date).days + 1
    total_allowance = days_since_reset * daily_allowance

    # Sum all logs from reset date onward
    logs = await db.budget_logs.find(
        {"date": {"$gte": reset_date.isoformat()}}
    ).to_list(length=None)

    total_spent = sum(log["amount_spent"] for log in logs)
    available = total_allowance - total_spent

    today_log = next((l for l in logs if l["date"] == today.isoformat()), None)

    return {
        "date": today.isoformat(),
        "daily_allowance": daily_allowance,
        "available_budget": available,
        "total_spent_this_month": total_spent,
        "total_allowance_this_month": total_allowance,
        "days_in_month_so_far": days_since_reset,
        "logged_today": today_log is not None,
        "today_spent": today_log["amount_spent"] if today_log else 0,
    }


async def get_monthly_summary(db, month: str) -> dict:
    import calendar

    year, mon = map(int, month.split("-"))
    days_in_month = calendar.monthrange(year, mon)[1]

    settings = await db.settings.find_one({"_id": "app_settings"})
    daily_allowance = settings["daily_allowance"] if settings else 500

    today = date.today()
    if year == today.year and mon == today.month:
        days_counted = (today - today.replace(day=1)).days + 1
    else:
        days_counted = days_in_month

    total_allowance = days_counted * daily_allowance

    logs = await db.budget_logs.find(
        {"date": {"$regex": f"^{month}"}}
    ).to_list(length=None)

    total_spent = sum(log["amount_spent"] for log in logs)
    days_logged = len(logs)

    return {
        "month": month,
        "total_allowance": total_allowance,
        "total_spent": total_spent,
        "total_saved": total_allowance - total_spent,
        "days_logged": days_logged,
        "days_in_month": days_in_month,
        "avg_daily_spend": round(total_spent / days_logged, 2) if days_logged else 0,
    }
