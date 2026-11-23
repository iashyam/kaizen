import asyncio
import json
import logging

from pywebpush import webpush, WebPushException

from config import settings

log = logging.getLogger(__name__)


class PushNotConfigured(Exception):
    pass


class SubscriptionGone(Exception):
    """Push service says the subscription is expired/unsubscribed (404/410)."""


async def send_push_notification(subscription: dict, title: str, body: str):
    """Send a web push. Raises on any failure so callers can report it."""
    if not settings.vapid_private_key:
        raise PushNotConfigured("VAPID private key not set on server")

    payload = json.dumps({"title": title, "body": body})
    try:
        # webpush is blocking (requests); keep it off the event loop.
        await asyncio.to_thread(
            webpush,
            subscription_info=subscription,
            data=payload,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_claim_email},
            ttl=86400,
            headers={"Urgency": "high"},
        )
    except WebPushException as e:
        status = getattr(e.response, "status_code", None)
        if status in (404, 410):
            raise SubscriptionGone(str(e)) from e
        detail = e.response.text if getattr(e, "response", None) is not None else str(e)
        raise RuntimeError(f"push service error {status}: {detail}") from e


async def push_to_user_doc(db, doc: dict, title: str, body: str):
    """Send to a settings doc's subscription; log failures, drop dead subscriptions."""
    sub = doc.get("push_subscription")
    if not sub:
        return
    try:
        await send_push_notification(sub, title, body)
    except SubscriptionGone:
        log.warning("push subscription gone for user %s; removing", doc.get("user_id"))
        await db.settings.update_one({"_id": doc["_id"]}, {"$unset": {"push_subscription": ""}})
    except Exception:
        log.exception("push failed for user %s", doc.get("user_id"))
