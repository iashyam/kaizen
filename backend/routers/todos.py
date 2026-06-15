from fastapi import APIRouter, Depends, Query
from bson import ObjectId
from datetime import datetime, date

from auth import get_current_user
from database import get_db
from models.todo import TodoCreate, TodoUpdate, TodoResponse

router = APIRouter(prefix="/api/todos", tags=["todos"])


def todo_doc_to_response(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "due_date": doc.get("due_date", date.today().isoformat()),
        "completed": doc.get("completed", False),
        "order": doc.get("order", 0),
        "created_at": doc.get("created_at", datetime.utcnow()),
    }


@router.get("/today", response_model=list[TodoResponse])
async def get_today_todos(user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    today_str = date.today().isoformat()
    todos = await db.todos.find({
        "due_date": {"$lte": today_str},
        "user_id": user_id,
    }).sort("order", 1).to_list(length=None)
    return [todo_doc_to_response(t) for t in todos]


@router.get("/by-date", response_model=list[TodoResponse])
async def get_todos_by_date(
    target: str = Query(default=None, alias="date"),
    user: dict = Depends(get_current_user),
):
    db = get_db()
    user_id = user["_id"]
    today_str = date.today().isoformat()
    target_date = target or today_str

    if target_date <= today_str:
        query = {"due_date": {"$lte": target_date}, "user_id": user_id}
    else:
        query = {"due_date": target_date, "user_id": user_id}

    todos = await db.todos.find(query).sort("order", 1).to_list(length=None)
    return [todo_doc_to_response(t) for t in todos]


@router.post("", response_model=TodoResponse)
async def create_todo(todo: TodoCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    doc = {
        "name": todo.name,
        "due_date": todo.due_date or date.today().isoformat(),
        "completed": False,
        "completed_at": None,
        "order": todo.order,
        "user_id": user_id,
        "created_at": datetime.utcnow(),
    }
    result = await db.todos.insert_one(doc)
    doc["_id"] = result.inserted_id
    return todo_doc_to_response(doc)


@router.put("/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: str, todo: TodoUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    update_data = {k: v for k, v in todo.model_dump().items() if v is not None}
    if update_data:
        await db.todos.update_one({"_id": ObjectId(todo_id), "user_id": user_id}, {"$set": update_data})
    doc = await db.todos.find_one({"_id": ObjectId(todo_id), "user_id": user_id})
    return todo_doc_to_response(doc)


@router.delete("/{todo_id}")
async def delete_todo(todo_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    await db.todos.delete_one({"_id": ObjectId(todo_id), "user_id": user_id})
    return {"ok": True}


@router.post("/{todo_id}/complete")
async def complete_todo(todo_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    await db.todos.update_one(
        {"_id": ObjectId(todo_id), "user_id": user_id},
        {"$set": {"completed": True, "completed_at": datetime.utcnow()}},
    )
    return {"ok": True}


@router.delete("/{todo_id}/complete")
async def uncomplete_todo(todo_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    await db.todos.update_one(
        {"_id": ObjectId(todo_id), "user_id": user_id},
        {"$set": {"completed": False, "completed_at": None}},
    )
    return {"ok": True}
