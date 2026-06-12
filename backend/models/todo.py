from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TodoCreate(BaseModel):
    name: str
    due_date: Optional[str] = None  # YYYY-MM-DD, defaults to today
    order: int = 0


class TodoUpdate(BaseModel):
    name: Optional[str] = None
    due_date: Optional[str] = None
    order: Optional[int] = None


class TodoResponse(BaseModel):
    id: str
    name: str
    due_date: str
    completed: bool
    order: int = 0
    created_at: datetime
