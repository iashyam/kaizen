from datetime import date, timedelta


def is_scheduled(habit_doc: dict, d: date) -> bool:
    """Check if habit is scheduled for given date."""
    repeat_type = habit_doc.get("repeat_type", "daily") if habit_doc else "daily"
    repeat_days = habit_doc.get("repeat_days", []) if habit_doc else []

    if repeat_type == "daily":
        return True
    elif repeat_type == "specific_days" and repeat_days:
        return d.weekday() in repeat_days
    elif repeat_type == "weekly":
        return True
    return True


async def calculate_streak(db, habit_id: str, habit_doc: dict = None, user_id: str = None) -> dict:
    query = {"habit_id": habit_id, "completed": True}
    if user_id:
        query["user_id"] = user_id
    logs = await db.habit_logs.find(query).sort("date", -1).to_list(length=None)

    if not logs:
        return {"current_streak": 0, "longest_streak": 0}

    date_set = {log["date"] for log in logs}
    repeat_type = habit_doc.get("repeat_type", "daily") if habit_doc else "daily"

    if repeat_type == "weekly":
        return _calc_weekly_streak(date_set)

    today = date.today()

    current_streak = 0
    check_date = today

    if is_scheduled(habit_doc, today) and today.isoformat() not in date_set:
        check_date = today - timedelta(days=1)
    elif not is_scheduled(habit_doc, today):
        check_date = today - timedelta(days=1)
        while not is_scheduled(habit_doc, check_date) and check_date > today - timedelta(days=30):
            check_date -= timedelta(days=1)

    while True:
        if is_scheduled(habit_doc, check_date):
            if check_date.isoformat() in date_set:
                current_streak += 1
            else:
                break
        check_date -= timedelta(days=1)
        if check_date < today - timedelta(days=365):
            break

    sorted_dates = sorted(date_set)
    if not sorted_dates:
        return {"current_streak": current_streak, "longest_streak": current_streak}

    longest_streak = 0
    streak = 0
    all_dates = []

    start_d = date.fromisoformat(sorted_dates[0])
    end_d = date.fromisoformat(sorted_dates[-1])
    d = start_d
    while d <= end_d:
        if is_scheduled(habit_doc, d):
            all_dates.append(d)
        d += timedelta(days=1)

    streak = 0
    for d in all_dates:
        if d.isoformat() in date_set:
            streak += 1
            longest_streak = max(longest_streak, streak)
        else:
            streak = 0

    return {"current_streak": current_streak, "longest_streak": longest_streak}


def _calc_weekly_streak(date_set: set) -> dict:
    """For weekly habits: streak = consecutive weeks with at least 1 completion."""
    if not date_set:
        return {"current_streak": 0, "longest_streak": 0}

    weeks = set()
    for ds in date_set:
        d = date.fromisoformat(ds)
        weeks.add(d.isocalendar()[:2])

    today = date.today()
    current_week = today.isocalendar()[:2]

    sorted_weeks = sorted(weeks, reverse=True)

    current_streak = 0
    check_week = current_week

    if check_week not in weeks:
        prev = today - timedelta(days=7)
        check_week = prev.isocalendar()[:2]

    while check_week in weeks:
        current_streak += 1
        yr, wk = check_week
        ref_date = date.fromisocalendar(yr, wk, 1) - timedelta(days=7)
        check_week = ref_date.isocalendar()[:2]

    sorted_weeks_asc = sorted(weeks)
    longest_streak = 0
    streak = 1
    for i in range(1, len(sorted_weeks_asc)):
        prev_yr, prev_wk = sorted_weeks_asc[i - 1]
        curr_yr, curr_wk = sorted_weeks_asc[i]
        prev_date = date.fromisocalendar(prev_yr, prev_wk, 1)
        curr_date = date.fromisocalendar(curr_yr, curr_wk, 1)
        if (curr_date - prev_date).days == 7:
            streak += 1
        else:
            longest_streak = max(longest_streak, streak)
            streak = 1
    longest_streak = max(longest_streak, streak)

    return {"current_streak": current_streak, "longest_streak": longest_streak}
