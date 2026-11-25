"""Prayer network: hub config (for the clock), coverage grid, weekly commitments."""

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.deps import SessionDep
from app.core.errors import ProblemError
from app.models.prayer import Intercessor, PrayerCommitment, PrayerHubConfig
from app.schemas.public import CommitmentIn, CommitmentOut, CoverageCellOut, PrayerHubOut
from app.services.prayer_time import DEFAULT_HUBS, local_to_utc_slot

router = APIRouter(prefix="/prayer", tags=["prayer"])


@router.get("/hubs", response_model=list[PrayerHubOut])
async def hubs(session: SessionDep) -> list[object]:
    rows = list(
        await session.scalars(
            select(PrayerHubConfig)
            .where(PrayerHubConfig.is_active.is_(True))
            .order_by(PrayerHubConfig.sort_order)
        )
    )
    return list(rows) if rows else list(DEFAULT_HUBS)


@router.get("/coverage", response_model=list[CoverageCellOut])
async def coverage(session: SessionDep) -> list[CoverageCellOut]:
    rows = await session.execute(
        select(PrayerCommitment.weekday_utc, PrayerCommitment.hour_utc, func.count())
        .where(PrayerCommitment.is_active.is_(True))
        .group_by(PrayerCommitment.weekday_utc, PrayerCommitment.hour_utc)
    )
    return [CoverageCellOut(weekday_utc=w, hour_utc=h, count=c) for w, h, c in rows]


@router.post("/commitments", response_model=CommitmentOut, status_code=201)
async def commit(body: CommitmentIn, session: SessionDep) -> PrayerCommitment:
    if not body.consent:
        raise ProblemError(422, "consent-required", "Please agree to be contacted about your hour")
    if not body.email and not body.phone:
        raise ProblemError(422, "contact-required", "Give an email or WhatsApp number")
    try:
        ZoneInfo(body.timezone)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ProblemError(422, "invalid-timezone", "Unknown time zone") from exc

    email = body.email.lower() if body.email else None
    intercessor = (
        await session.scalar(select(Intercessor).where(Intercessor.email == email))
        if email
        else None
    )
    if intercessor is None:
        intercessor = Intercessor(
            full_name=body.full_name,
            email=email,
            phone=body.phone,
            hub=body.hub,
            timezone=body.timezone,
            consent_contact=True,
        )
        session.add(intercessor)
        await session.flush()
    else:
        duplicate = await session.scalar(
            select(PrayerCommitment.id).where(
                PrayerCommitment.intercessor_id == intercessor.id,
                PrayerCommitment.local_weekday == body.local_weekday,
                PrayerCommitment.local_hour == body.local_hour,
                PrayerCommitment.is_active.is_(True),
            )
        )
        if duplicate:
            raise ProblemError(409, "already-committed", "You already hold this prayer hour")

    weekday_utc, hour_utc = local_to_utc_slot(body.local_weekday, body.local_hour, body.timezone)
    commitment = PrayerCommitment(
        intercessor_id=intercessor.id,
        hub=body.hub,
        timezone=body.timezone,
        local_weekday=body.local_weekday,
        local_hour=body.local_hour,
        weekday_utc=weekday_utc,
        hour_utc=hour_utc,
    )
    session.add(commitment)
    await session.commit()
    return commitment
