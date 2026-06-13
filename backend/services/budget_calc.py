from datetime import date


async def sync_balance(db, user_id: str) -> dict:
    """Add daily allowance for any missed days. Call before reading balance."""
    settings = await db.settings.find_one({"user_id": user_id})
    if not settings:
        # New user — create settings with today's allowance
        daily_allowance = 500
        settings = {
            "user_id": user_id,
            "daily_allowance": daily_allowance,
            "balance": daily_allowance,
            "last_balance_date": date.today().isoformat(),
        }
        await db.settings.insert_one(settings)
        return settings

    balance = settings.get("balance", 0)
    daily_allowance = settings.get("daily_allowance", 500)
    last_str = settings.get("last_balance_date")

    today = date.today()
    today_str = today.isoformat()

    if last_str and last_str < today_str:
        days_missed = (today - date.fromisoformat(last_str)).days
        balance += days_missed * daily_allowance
        await db.settings.update_one(
            {"user_id": user_id},
            {"$set": {"balance": balance, "last_balance_date": today_str}},
        )
    elif not last_str:
        # First time — give today's allowance
        balance += daily_allowance
        await db.settings.update_one(
            {"user_id": user_id},
            {"$set": {"balance": balance, "last_balance_date": today_str}},
        )

    settings["balance"] = balance
    settings["last_balance_date"] = today_str
    return settings


async def get_today_budget(db, user_id: str) -> dict:
    settings = await sync_balance(db, user_id)
    balance = settings.get("balance", 0)
    daily_allowance = settings.get("daily_allowance", 500)

    today_str = date.today().isoformat()
    today_log = await db.budget_logs.find_one({"date": today_str, "user_id": user_id})

    return {
        "date": today_str,
        "daily_allowance": daily_allowance,
        "available_budget": balance,
        "logged_today": today_log is not None,
        "today_spent": today_log["amount_spent"] if today_log else 0,
    }


async def get_monthly_summary(db, month: str, user_id: str) -> dict:
    import calendar

    year, mon = map(int, month.split("-"))
    days_in_month = calendar.monthrange(year, mon)[1]

    logs = await db.budget_logs.find(
        {"date": {"$regex": f"^{month}"}, "user_id": user_id}
    ).to_list(length=None)

    total_spent = sum(log["amount_spent"] for log in logs)
    days_logged = len(logs)

    settings = await db.settings.find_one({"user_id": user_id})
    daily_allowance = settings.get("daily_allowance", 500) if settings else 500

    today = date.today()
    if year == today.year and mon == today.month:
        days_counted = (today - today.replace(day=1)).days + 1
    else:
        days_counted = days_in_month

    total_allowance = days_counted * daily_allowance

    return {
        "month": month,
        "total_allowance": total_allowance,
        "total_spent": total_spent,
        "total_saved": total_allowance - total_spent,
        "days_logged": days_logged,
        "days_in_month": days_in_month,
        "avg_daily_spend": round(total_spent / days_logged, 2) if days_logged else 0,
    }
