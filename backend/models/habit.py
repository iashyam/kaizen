from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class HabitCreate(BaseModel):
    name: str
    category: str = "custom"  # morning | evening | weekend | custom
    reminder_time: Optional[str] = None  # HH:MM
    repeat_type: str = "daily"  # daily | specific_days | weekly
    repeat_days: list[int] = []  # 0=Mon, 1=Tue, ..., 6=Sun (for specific_days)
    order: int = 0


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    reminder_time: Optional[str] = None
    repeat_type: Optional[str] = None
    repeat_days: Optional[list[int]] = None
    order: Optional[int] = None


class HabitResponse(BaseModel):
    id: str
    name: str
    category: str
    reminder_time: Optional[str] = None
    repeat_type: str = "daily"
    repeat_days: list[int] = []
    order: int = 0
    created_at: datetime
    archived: bool = False


class HabitWithStatus(HabitResponse):
    completed_today: bool = False
    current_streak: int = 0


class HabitCheckRequest(BaseModel):
    date: str  # YYYY-MM-DD


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
