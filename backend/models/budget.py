from pydantic import BaseModel
from typing import Optional


class BudgetLogCreate(BaseModel):
    amount_spent: int
    note: Optional[str] = ""


class BudgetLogResponse(BaseModel):
    date: str
    amount_spent: int
    note: Optional[str] = ""


class BudgetTodayResponse(BaseModel):
    date: str
    daily_allowance: int
    available_budget: int
    total_spent_this_month: int
    total_allowance_this_month: int
    days_in_month_so_far: int
    logged_today: bool
    today_spent: int


class BudgetSummaryResponse(BaseModel):
    month: str
    total_allowance: int
    total_spent: int
    total_saved: int
    days_logged: int
    days_in_month: int
    avg_daily_spend: float
