"""Background jobs (ARQ + Redis).  Run: uv run arq app.worker.WorkerSettings

Sprint 1 ships the two need-housekeeping jobs. Later sprints add: email, prayer
reminders, pledge expiry/reminders, recurring sync, DST rebalance.
"""

from datetime import UTC, datetime
from typing import Any

from arq import cron
from arq.connections import RedisSettings
from sqlalchemy import func, select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.enums import NeedStatus
from app.models.needs import Need, NeedReservation, NeedStatusHistory
from app.services.need_states import next_status


async def release_expired_reservations(_: dict[str, Any] | None = None) -> int:
    """Free capacity held by abandoned checkouts / expired pledges; resync reserved totals."""
    now = datetime.now(UTC)
    async with SessionLocal() as session:
        expired = list(
            await session.scalars(
                select(NeedReservation).where(
                    NeedReservation.released_at.is_(None), NeedReservation.expires_at <= now
                )
            )
        )
        for r in expired:
            r.released_at = now
        await session.flush()
        for need_id in {r.need_id for r in expired}:
            live = await session.scalar(
                select(func.coalesce(func.sum(NeedReservation.amount_minor), 0)).where(
                    NeedReservation.need_id == need_id,
                    NeedReservation.released_at.is_(None),
                    NeedReservation.expires_at > now,
                )
            )
            need = await session.get(Need, need_id, with_for_update=True)
            if need:
                need.reserved_minor = int(live or 0)
        await session.commit()
        return len(expired)


async def expire_overdue_needs(_: dict[str, Any] | None = None) -> int:
    """Mark live needs past their deadline as EXPIRED so staff can decide what happens next."""
    now = datetime.now(UTC)
    async with SessionLocal() as session:
        overdue = list(
            await session.scalars(
                select(Need).where(
                    Need.status.in_((NeedStatus.OPEN, NeedStatus.PARTIALLY_FUNDED)),
                    Need.deadline_at.is_not(None),
                    Need.deadline_at < now,
                )
            )
        )
        for need in overdue:
            before = need.status
            need.status = next_status(before, "expire", need.raised_minor, need.target_minor)
            need.version += 1
            session.add(
                NeedStatusHistory(
                    need_id=need.id, from_status=before, to_status=need.status, action="expire"
                )
            )
        await session.commit()
        return len(overdue)


class WorkerSettings:
    functions = [release_expired_reservations, expire_overdue_needs]
    cron_jobs = [
        cron(release_expired_reservations, minute=set(range(0, 60, 5))),
        cron(expire_overdue_needs, hour={5}, minute={0}),  # 05:00 UTC = 06:00 Lagos
    ]
    redis_settings = RedisSettings.from_dsn(get_settings().redis_url)
