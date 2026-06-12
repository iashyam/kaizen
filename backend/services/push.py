import json
from pywebpush import webpush
from config import settings


async def send_push_notification(subscription: dict, title: str, body: str):
    if not settings.vapid_private_key:
        return

    payload = json.dumps({"title": title, "body": body})
    webpush(
        subscription_info=subscription,
        data=payload,
        vapid_private_key=settings.vapid_private_key,
        vapid_claims={"sub": settings.vapid_claim_email},
    )
