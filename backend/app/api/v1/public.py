"""Public reference data: regions, impact stats, content blocks, health."""

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter
from sqlalchemy import distinct, func, select, text

from app.api.deps import SessionDep
from app.core.errors import not_found
from app.models.community import ContentBlock
from app.models.enums import PUBLIC_NEED_STATUSES, NeedStatus
from app.models.field import Missionary, Region
from app.models.needs import Need
from app.models.prayer import PrayerCommitment
from app.schemas.public import ImpactStatsOut, RegionOut

router = APIRouter(tags=["public"])
health = APIRouter(tags=["health"])

_MET = (NeedStatus.FUNDED, NeedStatus.DISBURSED, NeedStatus.FULFILLED)


@health.get("/health")
async def liveness() -> dict[str, str]:
    return {"status": "ok"}


@health.get("/health/ready")
async def readiness(session: SessionDep) -> dict[str, str]:
    await session.execute(text("SELECT 1"))
    return {"status": "ready"}


@router.get("/regions", response_model=list[RegionOut])
async def regions(session: SessionDep) -> list[Region]:
    return list(await session.scalars(select(Region).order_by(Region.sort_order, Region.name)))


@router.get("/stats/impact", response_model=ImpactStatsOut)
async def impact(session: SessionDep) -> ImpactStatsOut:
    year_start = datetime(datetime.now(UTC).year, 1, 1, tzinfo=UTC)
    missionaries = await session.scalar(
        select(func.count(Missionary.id)).where(Missionary.is_active.is_(True))
    )
    met = await session.scalar(
        select(func.count(Need.id)).where(Need.status.in_(_MET), Need.funded_at >= year_start)
    )
    total = await session.scalar(
        select(func.count(Need.id)).where(
            Need.status.in_(PUBLIC_NEED_STATUSES), Need.created_at >= year_start
        )
    )
    covered = (
        select(PrayerCommitment.weekday_utc, PrayerCommitment.hour_utc)
        .where(PrayerCommitment.is_active.is_(True))
        .distinct()
        .subquery()
    )
    hours = await session.scalar(select(func.count()).select_from(covered))
    territories = await session.scalar(
        select(func.count(distinct(Missionary.region_id))).where(Missionary.is_active.is_(True))
    )
    return ImpactStatsOut(
        missionaries_supported=missionaries or 0,
        needs_met_this_year=met or 0,
        needs_total_this_year=total or 0,
        prayer_hours_covered=hours or 0,
        territories=territories or 0,
    )


@router.get("/content/{key}")
async def content(key: str, session: SessionDep) -> dict[str, Any]:
    block = await session.get(ContentBlock, key)
    if block is None:
        raise not_found("Content")
    return {"key": block.key, "data": block.data, "updatedAt": block.updated_at}
