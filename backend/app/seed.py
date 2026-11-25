"""Seed reference data (idempotent).  Run after migrations:

    uv run python -m app.seed            # hubs, regions, tiers, settings, admin
    uv run python -m app.seed --demo     # + SAMPLE missionaries/needs/prayer hours for previews

Sample records are clearly marked "Sample" and must never be loaded in production.
"""

import argparse
import asyncio
import random
import re
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.community import ContentBlock, Setting
from app.models.enums import (
    Currency,
    NeedCategory,
    NeedStatus,
    NeedUrgency,
    PartnerTier,
    PrayerHub,
    Role,
)
from app.models.field import Missionary, Region
from app.models.giving import PartnerTierPrice
from app.models.identity import User
from app.models.needs import Need, NeedStatusHistory
from app.models.prayer import (
    Intercessor,
    PrayerCommitment,
    PrayerHubConfig,
    PrayerWatch,
    PrayerWatchRound,
    PrayerWatchSlot,
)
from app.services.prayer_time import DEFAULT_HUBS, local_to_utc_slot

REGIONS = [
    ("West Africa", "west-africa"),
    ("Sahel & Northern Frontier", "sahel"),
    ("East Africa", "east-africa"),
    ("Liberia & Coast", "liberia-coast"),
    ("Unreached Territories", "unreached"),
]

# (tier, currency, major amount per month, description)
TIERS = [
    (PartnerTier.BRONZE, Currency.NGN, 15_000, "Basic nutrition and everyday field needs"),
    (PartnerTier.SILVER, Currency.NGN, 50_000, "Children's schooling, medical emergencies, travel"),
    (PartnerTier.GOLD, Currency.NGN, 150_000, "Full family sponsorship + quarterly field letters"),
    (PartnerTier.BRONZE, Currency.USD, 20, "Basic nutrition and everyday field needs"),
    (PartnerTier.SILVER, Currency.USD, 65, "Children's schooling, medical emergencies, travel"),
    (PartnerTier.GOLD, Currency.USD, 200, "Full family sponsorship + quarterly field letters"),
]

SETTINGS = {
    "needs.pledge_ttl_days": 7,
    "needs.checkout_ttl_minutes": 30,
    "needs.min_gift_minor": {
        "NGN": 100_000,
        "USD": 500,
        "GBP": 500,
        "EUR": 500,
        "CAD": 500,
        "AUD": 500,
        "KES": 50_000,
    },
    "needs.code_prefix": "JLN",
    "prayer.reminder_minutes": 30,
}

CONTENT = {
    "home.hero": {
        "title": "Equipping the saints together for souls",
        "scripture": "…and many others, which ministered unto him of their substance. Luke 8:3",
        "image": "/images/illustrations/luke-8-3.jpg",
    },
    "give.money_breakdown": {
        "items": [
            {"label": "Directly to field workers", "percent": 90},
            {"label": "Emergency health reserve", "percent": 5},
            {"label": "Operations & stewardship", "percent": 5},
        ],
        "note": "Placeholder figures. JLICI to confirm.",
    },
}


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


async def _get_or_create_admin(session: AsyncSession) -> User | None:
    s = get_settings()
    if not s.seed_admin_email:
        return None
    email = s.seed_admin_email.lower()
    user = await session.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            email=email,
            first_name="JLICI",
            last_name="Admin",
            password_hash=hash_password(s.seed_admin_password) if s.seed_admin_password else None,
            roles=[Role.SUPER_ADMIN.value],
        )
        session.add(user)
    return user


async def seed_base(session: AsyncSession) -> None:
    for h in DEFAULT_HUBS:
        if await session.get(PrayerHubConfig, h.hub) is None:
            session.add(
                PrayerHubConfig(
                    hub=h.hub,
                    display_name=h.display_name,
                    timezone=h.timezone,
                    watch_start_utc=h.watch_start_utc,
                    watch_end_utc=h.watch_end_utc,
                    sort_order=h.sort_order,
                )
            )
    for i, (name, slug) in enumerate(REGIONS):
        if not await session.scalar(select(Region.id).where(Region.slug == slug)):
            session.add(Region(name=name, slug=slug, sort_order=i))
    for tier, cur, major, desc in TIERS:
        exists = await session.scalar(
            select(PartnerTierPrice.id).where(
                PartnerTierPrice.tier == tier, PartnerTierPrice.currency == cur
            )
        )
        if not exists:
            session.add(
                PartnerTierPrice(
                    tier=tier, currency=cur, amount_minor=major * 100, description=desc
                )
            )
    for key, value in SETTINGS.items():
        if await session.get(Setting, key) is None:
            session.add(Setting(key=key, value=value))
    for key, data in CONTENT.items():
        if await session.get(ContentBlock, key) is None:
            session.add(ContentBlock(key=key, data=data))
    await _get_or_create_admin(session)
    await session.commit()


# ── SAMPLE data for design previews and tests (never production) ─────────────
SAMPLE_MISSIONARIES = [
    (
        "brother-e",
        "Brother E.",
        "sahel",
        True,
        "North-West Nigeria",
        "Village evangelism and church planting among unreached communities.",
        250_000,
    ),
    (
        "pastor-and-mrs-a",
        "Pastor & Mrs A.",
        "west-africa",
        False,
        "Kwara State, Nigeria",
        "Pioneering a rural church and a literacy class for children.",
        180_000,
    ),
    (
        "sister-g",
        "Sister G.",
        "liberia-coast",
        False,
        "Bong County, Liberia",
        "Community health outreach and women's discipleship.",
        150_000,
    ),
    (
        "the-m-family",
        "The M. Family",
        "east-africa",
        False,
        "Turkana, Kenya",
        "Water projects and discipleship among pastoralist families.",
        300_000,
    ),
]

# code, title, summary, category, urgency, region, missionary, target, raised,
# contributors, days to deadline, illustration, status
SAMPLE_NEEDS = [
    (
        "JLN-0001",
        "Motorcycle repair for village outreach",
        "Brother E.'s motorcycle carries him to six villages a week. The engine needs a rebuild.",
        NeedCategory.TRANSPORT,
        NeedUrgency.URGENT,
        "sahel",
        "brother-e",
        380_000,
        236_000,
        14,
        18,
        "luke-8-3.jpg",
        NeedStatus.PARTIALLY_FUNDED,
    ),
    (
        "JLN-0002",
        "School fees for three children, Term 2",
        "Three children of a rural pastor need second-term fees to stay in school.",
        NeedCategory.EDUCATION,
        NeedUrgency.NORMAL,
        "west-africa",
        "pastor-and-mrs-a",
        450_000,
        360_000,
        22,
        9,
        "ecclesiastes-3-1.jpg",
        NeedStatus.PARTIALLY_FUNDED,
    ),
    (
        "JLN-0003",
        "Malaria treatment and recovery",
        "Sister G. needs treatment, tests and two weeks of recovery support.",
        NeedCategory.MEDICAL,
        NeedUrgency.CRITICAL,
        "liberia-coast",
        "sister-g",
        180_000,
        27_000,
        3,
        6,
        "philippians-2-25.jpg",
        NeedStatus.PARTIALLY_FUNDED,
    ),
    (
        "JLN-0004",
        "Three months' rent for a mission family",
        "The M. family's landlord requires three months in advance for their base in Turkana.",
        NeedCategory.HOUSING,
        NeedUrgency.NORMAL,
        "east-africa",
        "the-m-family",
        600_000,
        120_000,
        7,
        25,
        "acts-6-3.jpg",
        NeedStatus.PARTIALLY_FUNDED,
    ),
    (
        "JLN-0005",
        "Food and upkeep for a church planter's family",
        "Monthly food and basic upkeep while a new church takes root.",
        NeedCategory.FOOD_UPKEEP,
        NeedUrgency.NORMAL,
        "sahel",
        "brother-e",
        150_000,
        0,
        0,
        30,
        "ezekiel-22-30.jpg",
        NeedStatus.OPEN,
    ),
    (
        "JLN-0006",
        "Bibles and discipleship materials",
        "Forty Bibles and workbooks for new believers' classes.",
        NeedCategory.MINISTRY_EQUIPMENT,
        NeedUrgency.NORMAL,
        "unreached",
        None,
        250_000,
        250_000,
        31,
        -4,
        "exodus-31-3.jpg",
        NeedStatus.FUNDED,
    ),
]


async def seed_demo(session: AsyncSession) -> None:
    author = await _get_or_create_admin(session)
    if author is None:
        email = "sample-coordinator@example.org"
        author = await session.scalar(select(User).where(User.email == email))
        if author is None:
            author = User(email=email, first_name="Sample", roles=[Role.FIELD_COORDINATOR.value])
            session.add(author)
    await session.flush()
    regions = {r.slug: r for r in await session.scalars(select(Region))}

    missionaries: dict[str, Missionary] = {}
    for slug, name, region, sensitive, loc, bio, target in SAMPLE_MISSIONARIES:
        m = await session.scalar(select(Missionary).where(Missionary.slug == slug))
        if m is None:
            m = Missionary(
                slug=slug,
                public_name=name,
                region_id=regions[region].id,
                is_sensitive=sensitive,
                public_location=loc,
                bio=f"Sample profile. {bio}",
                monthly_target_minor=target * 100,
            )
            session.add(m)
        missionaries[slug] = m
    await session.flush()

    now = datetime.now(UTC)
    for (
        code,
        title,
        summary,
        cat,
        urg,
        region,
        mslug,
        target,
        raised,
        n,
        days,
        img,
        status,
    ) in SAMPLE_NEEDS:
        if await session.scalar(select(Need.id).where(Need.code == code)):
            continue
        need = Need(
            code=code,
            slug=f"{code.lower()}-{_slug(title)}",
            title=title,
            summary=summary,
            story=(
                f"Sample need for design preview. {summary} "
                "Every gift, large or small, counts toward the total."
            ),
            category=cat,
            urgency=urg,
            region_id=regions[region].id,
            missionary_id=missionaries[mslug].id if mslug else None,
            target_minor=target * 100,
            raised_minor=raised * 100,
            contributor_count=n,
            currency=Currency.NGN,
            status=status,
            opens_at=now - timedelta(days=10),
            deadline_at=now + timedelta(days=days),
            funded_at=now - timedelta(days=2) if status == NeedStatus.FUNDED else None,
            cover_image_path=f"/images/illustrations/{img}",
            is_featured=True,
            created_by_id=author.id,
            approved_by_id=author.id,
            approved_at=now - timedelta(days=10),
        )
        session.add(need)
        await session.flush()
        session.add(NeedStatusHistory(need_id=need.id, to_status=status, action="seed"))

    if not await session.scalar(select(Intercessor.id).limit(1)):
        rng = random.Random(7)
        zones = {h.hub: h.timezone for h in DEFAULT_HUBS}
        for i in range(60):
            hub = rng.choice(list(PrayerHub))
            person = Intercessor(
                full_name=f"Sample Intercessor {i + 1}",
                email=f"sample{i + 1}@example.org",
                hub=hub,
                timezone=zones[hub],
                consent_contact=True,
            )
            session.add(person)
            await session.flush()
            for _ in range(rng.randint(1, 3)):
                wd, hr = rng.randint(0, 6), rng.choice([5, 6, 7, 8, 12, 13, 18, 19, 20, 21, 22])
                uw, uh = local_to_utc_slot(wd, hr, zones[hub])
                session.add(
                    PrayerCommitment(
                        intercessor_id=person.id,
                        hub=hub,
                        timezone=zones[hub],
                        local_weekday=wd,
                        local_hour=hr,
                        weekday_utc=uw,
                        hour_utc=uh,
                    )
                )
    await _seed_watches(session)
    await session.commit()


async def _seed_watches(session: AsyncSession) -> None:
    """Two SAMPLE watches: the quarterly 24-hour cycle and a two-month chain fast."""
    if await session.scalar(select(PrayerWatch.id).limit(1)):
        return

    cycle_start = datetime(2027, 1, 30, tzinfo=UTC)  # Saturday
    cycle = PrayerWatch(
        slug="quarterly-24-hour-watch-q1-2027",
        title="Quarterly 24-Hour Prayer Watch",
        description=(
            "Sample watch. Eight 3-hour shifts carry prayer for the nations and our labourers "
            "around the world in one day: Sydney to Lagos to New York to Vancouver."
        ),
        banner_image="/images/illustrations/matthew-26-41-watch.jpg",
        starts_at=cycle_start,
        ends_at=cycle_start + timedelta(hours=24),
        is_published=True,
    )
    session.add(cycle)
    await session.flush()
    rnd = PrayerWatchRound(watch_id=cycle.id, label="Your 3-hour shift", sort_order=0)
    session.add(rnd)
    await session.flush()
    for i in range(8):
        start = cycle_start + timedelta(hours=3 * i)
        session.add(
            PrayerWatchSlot(
                round_id=rnd.id, starts_at=start, ends_at=start + timedelta(hours=3), capacity=12
            )
        )

    chain = PrayerWatch(
        slug="labourers-fast-feb-mar-2027",
        title="Labourers' Fast: February and March",
        description=(
            "Sample watch. Pick one 3-day fast in each month so that, together, we cover every "
            "day of February and March in prayer for missionaries in the field."
        ),
        banner_image="/images/illustrations/isaiah-59-15.jpg",
        starts_at=datetime(2027, 2, 1, tzinfo=UTC),
        ends_at=datetime(2027, 3, 31, tzinfo=UTC),
        is_published=True,
    )
    session.add(chain)
    await session.flush()
    months = [("February fast", 2, 27), ("March fast", 3, 30)]
    for order, (label, month, last_day) in enumerate(months):
        r = PrayerWatchRound(watch_id=chain.id, label=label, sort_order=order)
        session.add(r)
        await session.flush()
        for day in range(1, last_day + 1, 3):
            start = datetime(2027, month, day, tzinfo=UTC)
            session.add(
                PrayerWatchSlot(round_id=r.id, starts_at=start, ends_at=start + timedelta(days=3))
            )


async def main(demo: bool) -> None:
    async with SessionLocal() as session:
        await seed_base(session)
        if demo:
            if get_settings().is_production:
                raise SystemExit("Refusing to load sample data in production")
            await seed_demo(session)
    print("Seed complete" + (" (with SAMPLE data)" if demo else ""))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--demo", action="store_true", help="also load sample preview data")
    asyncio.run(main(parser.parse_args().demo))
