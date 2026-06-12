from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ChallengeCreate(BaseModel):
    name: str
    habit_ids: list[str]
    target_days: int = 30


class ChallengeUpdate(BaseModel):
    name: Optional[str] = None
    habit_ids: Optional[list[str]] = None
    target_days: Optional[int] = None


class ChallengeExtend(BaseModel):
    extra_days: int = 30


class ChallengeResponse(BaseModel):
    id: str
    name: str
    habit_ids: list[str]
    target_days: int = 30
    current_streak: int
    longest_streak: int
    last_completed_date: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    milestones: list[dict] = []
    created_at: datetime
    archived: bool = False
