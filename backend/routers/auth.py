from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import get_db
from models.user import TokenResponse, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse)
async def signup(data: UserCreate):
    db = get_db()
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_doc = {
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "name": data.name,
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Create default per-user settings
    await db.settings.insert_one({
        "user_id": user_id,
        "daily_allowance": 500,
        "monthly_reset_day": 1,
        "telegram_chat_id": "",
        "timezone": "Asia/Kolkata",
    })

    token = create_access_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user_doc["email"], name=user_doc["name"]),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user["email"], name=user["name"]),
    )


@router.get("/me", response_model=UserResponse)
async def me(user: dict = Depends(get_current_user)):
    return UserResponse(id=user["_id"], email=user["email"], name=user["name"])
