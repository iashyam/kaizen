from fastapi import APIRouter
from bson import ObjectId
from datetime import datetime, date, timedelta

from database import get_db
from models.challenge import ChallengeCreate, ChallengeUpdate, ChallengeExtend, ChallengeResponse

router = APIRouter(prefix="/api/challenges", tags=["challenges"])

MILESTONE_DAYS = [3, 7, 14, 21, 30, 45, 60, 90, 100, 150, 200, 365]


def get_milestones(target_days: int, current_streak: int, completed_dates: set[str]) -> list[dict]:
    """Generate milestone markers for the challenge."""
    milestones = []
    for m in MILESTONE_DAYS:
        if m > target_days:
            break
        reached = current_streak >= m
        # Find the date this milestone was reached (m-th completed date)
        reached_date = None
        if reached and len(completed_dates) >= m:
            sorted_d = sorted(completed_dates)
            reached_date = sorted_d[m - 1] if m <= len(sorted_d) else None
        milestones.append({
            "days": m,
            "reached": reached,
            "date": reached_date,
        })
    return milestones


def doc_to_response(doc, milestones=None) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "habit_ids": doc.get("habit_ids", []),
        "target_days": doc.get("target_days", 30),
        "current_streak": doc.get("current_streak", 0),
        "longest_streak": doc.get("longest_streak", 0),
        "last_completed_date": doc.get("last_completed_date"),
        "started_at": doc.get("started_at"),
        "completed_at": doc.get("completed_at"),
        "milestones": milestones or doc.get("milestones", []),
        "created_at": doc.get("created_at", datetime.utcnow()),
        "archived": doc.get("archived", False),
    }


async def recalc_streak(db, challenge_doc: dict) -> dict:
    """Recalculate challenge streak based on habit completion history."""
    habit_ids = challenge_doc.get("habit_ids", [])
    if not habit_ids:
        return {
            "current_streak": 0, "longest_streak": 0,
            "last_completed_date": None, "started_at": None,
            "completed_at": None, "milestones": [],
        }

    date_sets = []
    for hid in habit_ids:
        logs = await db.habit_logs.find(
            {"habit_id": hid, "completed": True}
        ).to_list(length=None)
        date_sets.append({log["date"] for log in logs})

    if not date_sets:
        return {
            "current_streak": 0, "longest_streak": 0,
            "last_completed_date": None, "started_at": None,
            "completed_at": None, "milestones": [],
        }

    all_completed = date_sets[0]
    for ds in date_sets[1:]:
        all_completed = all_completed & ds

    if not all_completed:
        return {
            "current_streak": 0, "longest_streak": 0,
            "last_completed_date": None, "started_at": None,
            "completed_at": None, "milestones": [],
        }

    sorted_dates = sorted(all_completed)
    last_date = sorted_dates[-1]
    first_date = sorted_dates[0]

    # Current streak: walk back from today
    today = date.today()
    current_streak = 0
    check = today

    if today.isoformat() not in all_completed:
        check = today - timedelta(days=1)

    while check.isoformat() in all_completed:
        current_streak += 1
        check -= timedelta(days=1)

    # Longest streak
    longest = 0
    streak = 1
    for i in range(1, len(sorted_dates)):
        prev = date.fromisoformat(sorted_dates[i - 1])
        curr = date.fromisoformat(sorted_dates[i])
        if (curr - prev).days == 1:
            streak += 1
        else:
            longest = max(longest, streak)
            streak = 1
    longest = max(longest, streak)

    # Started at = first date in current streak
    started_at = None
    if current_streak > 0:
        started_at = (today - timedelta(days=current_streak - 1)).isoformat()
        if today.isoformat() not in all_completed:
            started_at = (today - timedelta(days=current_streak)).isoformat()

    # Completed at = when streak hit target
    target = challenge_doc.get("target_days", 30)
    completed_at = challenge_doc.get("completed_at")
    if current_streak >= target and not completed_at:
        completed_at = today.isoformat()

    milestones = get_milestones(target, current_streak, all_completed)

    return {
        "current_streak": current_streak,
        "longest_streak": longest,
        "last_completed_date": last_date,
        "started_at": started_at,
        "completed_at": completed_at,
        "milestones": milestones,
    }


@router.get("", response_model=list[ChallengeResponse])
async def list_challenges():
    db = get_db()
    challenges = await db.challenges.find(
        {"archived": {"$ne": True}}
    ).sort("created_at", -1).to_list(length=None)

    result = []
    for c in challenges:
        streak_data = await recalc_streak(db, c)
        await db.challenges.update_one({"_id": c["_id"]}, {"$set": streak_data})
        resp = doc_to_response(c, streak_data.get("milestones"))
        resp.update(streak_data)
        result.append(resp)
    return result


@router.post("", response_model=ChallengeResponse)
async def create_challenge(data: ChallengeCreate):
    db = get_db()
    doc = {
        "name": data.name,
        "habit_ids": data.habit_ids,
        "target_days": data.target_days,
        "current_streak": 0,
        "longest_streak": 0,
        "last_completed_date": None,
        "started_at": None,
        "completed_at": None,
        "milestones": [],
        "created_at": datetime.utcnow(),
        "archived": False,
    }
    result = await db.challenges.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_response(doc)


@router.put("/{challenge_id}", response_model=ChallengeResponse)
async def update_challenge(challenge_id: str, data: ChallengeUpdate):
    db = get_db()
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if update:
        await db.challenges.update_one({"_id": ObjectId(challenge_id)}, {"$set": update})
    doc = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
    streak_data = await recalc_streak(db, doc)
    await db.challenges.update_one({"_id": doc["_id"]}, {"$set": streak_data})
    resp = doc_to_response(doc, streak_data.get("milestones"))
    resp.update(streak_data)
    return resp


@router.post("/{challenge_id}/extend", response_model=ChallengeResponse)
async def extend_challenge(challenge_id: str, data: ChallengeExtend):
    """Extend a completed challenge by adding more days to target."""
    db = get_db()
    doc = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
    new_target = doc.get("target_days", 30) + data.extra_days
    await db.challenges.update_one(
        {"_id": ObjectId(challenge_id)},
        {"$set": {"target_days": new_target, "completed_at": None}},
    )
    doc = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
    streak_data = await recalc_streak(db, doc)
    await db.challenges.update_one({"_id": doc["_id"]}, {"$set": streak_data})
    resp = doc_to_response(doc, streak_data.get("milestones"))
    resp.update(streak_data)
    return resp


@router.delete("/{challenge_id}")
async def delete_challenge(challenge_id: str):
    db = get_db()
    await db.challenges.update_one(
        {"_id": ObjectId(challenge_id)}, {"$set": {"archived": True}}
    )
    return {"ok": True}


@router.get("/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(challenge_id: str):
    db = get_db()
    doc = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
    streak_data = await recalc_streak(db, doc)
    resp = doc_to_response(doc, streak_data.get("milestones"))
    resp.update(streak_data)
    return resp


@router.get("/{challenge_id}/calendar")
async def get_challenge_calendar(challenge_id: str, start: str = "", end: str = ""):
    """Get dates where all habits in challenge were completed."""
    db = get_db()
    doc = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
    habit_ids = doc.get("habit_ids", [])
    if not habit_ids:
        return []

    date_sets = []
    for hid in habit_ids:
        query = {"habit_id": hid, "completed": True}
        if start and end:
            query["date"] = {"$gte": start, "$lte": end}
        logs = await db.habit_logs.find(query).to_list(length=None)
        date_sets.append({log["date"] for log in logs})

    if not date_sets:
        return []

    all_completed = date_sets[0]
    for ds in date_sets[1:]:
        all_completed = all_completed & ds

    return [{"date": d, "completed": True} for d in sorted(all_completed)]


@router.get("/{challenge_id}/today")
async def get_challenge_today(challenge_id: str):
    """Get today's status for each habit in challenge."""
    db = get_db()
    doc = await db.challenges.find_one({"_id": ObjectId(challenge_id)})
    today_str = date.today().isoformat()
    habit_ids = doc.get("habit_ids", [])

    results = []
    for hid in habit_ids:
        habit = await db.habits.find_one({"_id": ObjectId(hid)})
        if not habit:
            continue
        log = await db.habit_logs.find_one({"habit_id": hid, "date": today_str})
        results.append({
            "habit_id": hid,
            "name": habit["name"],
            "category": habit.get("category", "custom"),
            "completed": log is not None and log.get("completed", False),
        })

    all_done = len(results) > 0 and all(r["completed"] for r in results)
    return {
        "habits": results,
        "all_completed_today": all_done,
        "completed_count": sum(1 for r in results if r["completed"]),
        "total_count": len(results),
    }
