"""Prayer network: hub config (for the clock), coverage grid, weekly commitments."""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep
from app.core.errors import ProblemError, not_found
from app.models.prayer import (
    Intercessor,
    PrayerCommitment,
    PrayerHubConfig,
    PrayerWatch,
    PrayerWatchRound,
    PrayerWatchSignup,
)
from app.schemas.public import (
    CommitmentIn,
    CommitmentOut,
    CoverageCellOut,
    PrayerHubOut,
    WatchDetailOut,
    WatchRoundOut,
    WatchSignupIn,
    WatchSignupOut,
    WatchSignupSlotOut,
    WatchSlotOut,
    WatchSummaryOut,
)
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


# ── Prayer watches (campaign sign-up: rounds of shifts) ──────────────────────
def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


async def _taken_by_slot(session: SessionDep, watch_id: str) -> dict[str, int]:
    rows = await session.execute(
        select(PrayerWatchSignup.slot_id, func.count())
        .where(PrayerWatchSignup.watch_id == watch_id)
        .group_by(PrayerWatchSignup.slot_id)
    )
    return {slot_id: n for slot_id, n in rows}


async def _load_watch(session: SessionDep, slug: str) -> PrayerWatch:
    watch = await session.scalar(
        select(PrayerWatch)
        .where(PrayerWatch.slug == slug, PrayerWatch.is_published.is_(True))
        .options(selectinload(PrayerWatch.rounds).selectinload(PrayerWatchRound.slots))
    )
    if watch is None:
        raise not_found("Prayer watch")
    return watch


@router.get("/watches", response_model=list[WatchSummaryOut])
async def list_watches(session: SessionDep) -> list[WatchSummaryOut]:
    watches = await session.scalars(
        select(PrayerWatch)
        .where(PrayerWatch.is_published.is_(True), PrayerWatch.ends_at > datetime.now(UTC))
        .options(selectinload(PrayerWatch.rounds))
        .order_by(PrayerWatch.starts_at)
    )
    out = []
    for w in watches:
        signups = await session.scalar(
            select(func.count(func.distinct(PrayerWatchSignup.intercessor_id))).where(
                PrayerWatchSignup.watch_id == w.id
            )
        )
        out.append(
            WatchSummaryOut(
                slug=w.slug,
                title=w.title,
                description=w.description,
                banner_image=w.banner_image,
                starts_at=w.starts_at,
                ends_at=w.ends_at,
                round_count=len(w.rounds),
                signup_count=signups or 0,
            )
        )
    return out


@router.get("/watches/{slug}", response_model=WatchDetailOut)
async def get_watch(slug: str, session: SessionDep) -> WatchDetailOut:
    watch = await _load_watch(session, slug)
    taken = await _taken_by_slot(session, watch.id)
    signups = await session.scalar(
        select(func.count(func.distinct(PrayerWatchSignup.intercessor_id))).where(
            PrayerWatchSignup.watch_id == watch.id
        )
    )
    rounds = [
        WatchRoundOut(
            id=r.id,
            label=r.label,
            is_required=r.is_required,
            slots=[
                WatchSlotOut(
                    id=s.id,
                    starts_at=s.starts_at,
                    ends_at=s.ends_at,
                    capacity=s.capacity,
                    taken=taken.get(s.id, 0),
                    is_full=s.capacity is not None and taken.get(s.id, 0) >= s.capacity,
                )
                for s in r.slots
            ],
        )
        for r in watch.rounds
    ]
    return WatchDetailOut(
        slug=watch.slug,
        title=watch.title,
        description=watch.description,
        banner_image=watch.banner_image,
        starts_at=watch.starts_at,
        ends_at=watch.ends_at,
        round_count=len(rounds),
        signup_count=signups or 0,
        rounds=rounds,
    )


@router.post("/watches/{slug}/signups", response_model=WatchSignupOut, status_code=201)
async def sign_up_for_watch(slug: str, body: WatchSignupIn, session: SessionDep) -> WatchSignupOut:
    if not body.consent:
        raise ProblemError(422, "consent-required", "Please agree to be contacted about your watch")
    try:
        ZoneInfo(body.timezone)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ProblemError(422, "invalid-timezone", "Unknown time zone") from exc

    watch = await _load_watch(session, slug)
    if _aware(watch.ends_at) <= datetime.now(UTC):
        raise ProblemError(409, "watch-ended", "This prayer watch has ended")

    slot_index = {s.id: (r, s) for r in watch.rounds for s in r.slots}
    chosen: dict[str, str] = {}  # round_id -> slot_id
    for slot_id in body.slot_ids:
        if slot_id not in slot_index:
            raise ProblemError(
                422, "unknown-shift", "One of the chosen shifts is not part of this watch"
            )
        rnd, _ = slot_index[slot_id]
        if rnd.id in chosen:
            raise ProblemError(422, "one-shift-per-round", f"Choose only one shift for {rnd.label}")
        chosen[rnd.id] = slot_id
    missing = [r.label for r in watch.rounds if r.is_required and r.id not in chosen]
    if missing:
        raise ProblemError(
            422, "shift-required", f"Choose a shift for {', '.join(missing)}", rounds=missing
        )

    taken = await _taken_by_slot(session, watch.id)
    for slot_id in chosen.values():
        _, slot = slot_index[slot_id]
        if slot.capacity is not None and taken.get(slot_id, 0) >= slot.capacity:
            raise ProblemError(
                409,
                "shift-full",
                "That shift is already full. Please choose another.",
                slotId=slot_id,
            )

    email = body.email.lower()
    person = await session.scalar(select(Intercessor).where(Intercessor.email == email))
    if person is None:
        person = Intercessor(
            full_name=f"{body.first_name} {body.last_name}".strip(),
            email=email,
            phone=body.phone,
            hub=body.hub,
            timezone=body.timezone,
            consent_contact=True,
        )
        session.add(person)
        await session.flush()
    elif await session.scalar(
        select(PrayerWatchSignup.id).where(
            PrayerWatchSignup.watch_id == watch.id, PrayerWatchSignup.intercessor_id == person.id
        )
    ):
        raise ProblemError(
            409, "already-signed-up", "You have already reserved shifts for this watch"
        )

    for slot_id in chosen.values():
        session.add(PrayerWatchSignup(watch_id=watch.id, slot_id=slot_id, intercessor_id=person.id))
    await session.commit()

    picked = sorted((slot_index[s] for s in chosen.values()), key=lambda rs: rs[1].starts_at)
    return WatchSignupOut(
        watch_title=watch.title,
        slots=[
            WatchSignupSlotOut(round_label=r.label, starts_at=s.starts_at, ends_at=s.ends_at)
            for r, s in picked
        ],
        meeting_url=watch.meeting_url,
    )
