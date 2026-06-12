from fastapi import APIRouter
from datetime import date, datetime

from database import get_db
from models.budget import BudgetLogCreate, BudgetLogResponse, BudgetTodayResponse, BudgetSummaryResponse
from services.budget_calc import get_today_budget, get_monthly_summary

router = APIRouter(prefix="/api/budget", tags=["budget"])


@router.get("/today", response_model=BudgetTodayResponse)
async def budget_today():
    db = get_db()
    return await get_today_budget(db)


@router.post("/log", response_model=BudgetLogResponse)
async def log_spending(entry: BudgetLogCreate):
    db = get_db()
    today_str = date.today().isoformat()
    existing = await db.budget_logs.find_one({"date": today_str})

    if existing:
        new_amount = existing["amount_spent"] + entry.amount_spent
        old_note = existing.get("note", "")
        new_note = f"{old_note}, {entry.note}" if old_note and entry.note else (entry.note or old_note)
        await db.budget_logs.update_one(
            {"date": today_str},
            {"$set": {
                "amount_spent": new_amount,
                "note": new_note,
                "logged_at": datetime.utcnow(),
            }},
        )
        return {"date": today_str, "amount_spent": new_amount, "note": new_note}
    else:
        await db.budget_logs.insert_one({
            "date": today_str,
            "amount_spent": entry.amount_spent,
            "note": entry.note,
            "logged_at": datetime.utcnow(),
        })
        return {"date": today_str, "amount_spent": entry.amount_spent, "note": entry.note}


@router.put("/log/{log_date}", response_model=BudgetLogResponse)
async def update_spending(log_date: str, entry: BudgetLogCreate):
    db = get_db()
    await db.budget_logs.update_one(
        {"date": log_date},
        {"$set": {
            "amount_spent": entry.amount_spent,
            "note": entry.note,
            "logged_at": datetime.utcnow(),
        }},
        upsert=True,
    )
    return {"date": log_date, "amount_spent": entry.amount_spent, "note": entry.note}


@router.get("/history", response_model=list[BudgetLogResponse])
async def budget_history(month: str = ""):
    db = get_db()
    if not month:
        month = date.today().strftime("%Y-%m")
    logs = await db.budget_logs.find(
        {"date": {"$regex": f"^{month}"}}
    ).sort("date", -1).to_list(length=None)
    return [{"date": l["date"], "amount_spent": l["amount_spent"], "note": l.get("note", "")} for l in logs]


@router.get("/summary", response_model=BudgetSummaryResponse)
async def budget_summary(month: str = ""):
    db = get_db()
    if not month:
        month = date.today().strftime("%Y-%m")
    return await get_monthly_summary(db, month)


@router.post("/withdraw")
async def withdraw_savings():
    """Reset budget period to today (user withdrew their savings)."""
    db = get_db()
    today_str = date.today().isoformat()
    await db.settings.update_one(
        {"_id": "app_settings"},
        {"$set": {"last_budget_reset": today_str}},
        upsert=True,
    )
    return {"ok": True, "reset_date": today_str}
