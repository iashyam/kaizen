from fastapi import APIRouter, Depends
from datetime import date, datetime

from auth import get_current_user
from database import get_db
from models.budget import BudgetLogCreate, BudgetLogResponse, BudgetTodayResponse, BudgetSummaryResponse
from services.budget_calc import get_today_budget, get_monthly_summary, sync_balance

router = APIRouter(prefix="/api/budget", tags=["budget"])


@router.get("/today", response_model=BudgetTodayResponse)
async def budget_today(user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    return await get_today_budget(db, user_id)


@router.post("/log", response_model=BudgetLogResponse)
async def log_spending(entry: BudgetLogCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    today_str = date.today().isoformat()

    # Sync balance first (add any missed daily allowances)
    await sync_balance(db, user_id)

    existing = await db.budget_logs.find_one({"date": today_str, "user_id": user_id})

    if existing:
        new_amount = existing["amount_spent"] + entry.amount_spent
        old_note = existing.get("note", "")
        new_note = f"{old_note}, {entry.note}" if old_note and entry.note else (entry.note or old_note)
        await db.budget_logs.update_one(
            {"date": today_str, "user_id": user_id},
            {"$set": {
                "amount_spent": new_amount,
                "note": new_note,
                "logged_at": datetime.utcnow(),
            }},
        )
        # Subtract only the new addition from balance
        await db.settings.update_one(
            {"user_id": user_id},
            {"$inc": {"balance": -entry.amount_spent}},
        )
        return {"date": today_str, "amount_spent": new_amount, "note": new_note}
    else:
        await db.budget_logs.insert_one({
            "date": today_str,
            "amount_spent": entry.amount_spent,
            "note": entry.note,
            "user_id": user_id,
            "logged_at": datetime.utcnow(),
        })
        await db.settings.update_one(
            {"user_id": user_id},
            {"$inc": {"balance": -entry.amount_spent}},
        )
        return {"date": today_str, "amount_spent": entry.amount_spent, "note": entry.note}


@router.put("/log/{log_date}", response_model=BudgetLogResponse)
async def update_spending(log_date: str, entry: BudgetLogCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]

    # Get old amount to calculate balance diff
    old_log = await db.budget_logs.find_one({"date": log_date, "user_id": user_id})
    old_amount = old_log["amount_spent"] if old_log else 0
    diff = entry.amount_spent - old_amount

    await db.budget_logs.update_one(
        {"date": log_date, "user_id": user_id},
        {"$set": {
            "amount_spent": entry.amount_spent,
            "note": entry.note,
            "logged_at": datetime.utcnow(),
        }},
        upsert=True,
    )
    if diff != 0:
        await db.settings.update_one(
            {"user_id": user_id},
            {"$inc": {"balance": -diff}},
        )
    return {"date": log_date, "amount_spent": entry.amount_spent, "note": entry.note}


@router.get("/history", response_model=list[BudgetLogResponse])
async def budget_history(month: str = "", user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    if not month:
        month = date.today().strftime("%Y-%m")
    logs = await db.budget_logs.find(
        {"date": {"$regex": f"^{month}"}, "user_id": user_id}
    ).sort("date", -1).to_list(length=None)
    return [{"date": l["date"], "amount_spent": l["amount_spent"], "note": l.get("note", "")} for l in logs]


@router.get("/summary", response_model=BudgetSummaryResponse)
async def budget_summary(month: str = "", user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    if not month:
        month = date.today().strftime("%Y-%m")
    return await get_monthly_summary(db, month, user_id)


@router.post("/withdraw")
async def withdraw_savings(user: dict = Depends(get_current_user)):
    """User withdrew savings — zero out balance."""
    db = get_db()
    user_id = user["_id"]
    await sync_balance(db, user_id)
    await db.settings.update_one(
        {"user_id": user_id},
        {"$set": {"balance": 0}},
    )
    return {"ok": True, "reset_date": date.today().isoformat()}
