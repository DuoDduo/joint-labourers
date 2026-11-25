"""Pure domain logic: money, need status machine, prayer-hub time zones (DST)."""

from datetime import UTC, date, datetime

import pytest

from app.models.enums import Currency, NeedStatus, PrayerHub
from app.services.money import available_minor, percent_funded, to_minor
from app.services.need_states import (
    InvalidTransitionError,
    can_perform,
    funding_status,
    next_status,
)
from app.services.prayer_time import active_hub, local_to_utc_slot, next_handover


# ── settings ─────────────────────────────────────────────────────────────────
def test_host_postgres_urls_get_the_async_driver() -> None:
    from app.core.config import Settings

    assert Settings(database_url="postgres://u:p@h:5432/db").database_url == (
        "postgresql+asyncpg://u:p@h:5432/db"
    )
    assert Settings(database_url="postgresql://u:p@h/db").database_url.startswith(
        "postgresql+asyncpg://"
    )


def test_production_refuses_dev_secrets_and_sqlite() -> None:
    from pydantic import ValidationError

    from app.core.config import Settings

    with pytest.raises(ValidationError):
        Settings(app_env="production", database_url="postgres://u:p@h/db")
    with pytest.raises(ValidationError):
        Settings(
            app_env="staging",
            jwt_secret="x" * 40,
            field_encryption_key="y" * 40,
            revalidate_secret="z" * 40,
            database_url="sqlite+aiosqlite:///./x.db",
        )


# ── money ────────────────────────────────────────────────────────────────────
def test_to_minor_rounds_half_up() -> None:
    assert to_minor("10.005", Currency.USD) == 1001
    assert to_minor(15000, Currency.NGN) == 1_500_000


def test_percent_never_shows_100_until_funded() -> None:
    assert percent_funded(9_999, 10_000) == 99
    assert percent_funded(10_000, 10_000) == 100
    assert percent_funded(0, 0) == 0


def test_available_excludes_reservations_and_never_negative() -> None:
    assert available_minor(100, 60, 30) == 10
    assert available_minor(100, 90, 30) == 0


# ── need status machine ──────────────────────────────────────────────────────
def test_happy_path() -> None:
    s = NeedStatus.DRAFT
    s = next_status(s, "submit", 0, 100)
    assert s is NeedStatus.IN_REVIEW
    s = next_status(s, "approve", 0, 100)
    assert s is NeedStatus.OPEN
    s = next_status(s, "receive_gift", 40, 100)
    assert s is NeedStatus.PARTIALLY_FUNDED
    s = next_status(s, "receive_gift", 100, 100)
    assert s is NeedStatus.FUNDED
    s = next_status(s, "mark_disbursed", 100, 100)
    assert s is NeedStatus.DISBURSED
    assert next_status(s, "fulfil", 100, 100) is NeedStatus.FULFILLED


def test_extend_after_expiry_returns_to_funding_state() -> None:
    assert next_status(NeedStatus.EXPIRED, "extend", 0, 100) is NeedStatus.OPEN
    assert next_status(NeedStatus.EXPIRED, "extend", 30, 100) is NeedStatus.PARTIALLY_FUNDED


@pytest.mark.parametrize(
    ("current", "action"),
    [
        (NeedStatus.DRAFT, "approve"),
        (NeedStatus.FUNDED, "cancel"),
        (NeedStatus.FULFILLED, "pause"),
        (NeedStatus.OPEN, "mark_disbursed"),
    ],
)
def test_illegal_moves_are_rejected(current: NeedStatus, action: str) -> None:
    with pytest.raises(InvalidTransitionError):
        next_status(current, action, 0, 100)


def test_roles() -> None:
    assert can_perform("mark_disbursed", ["FINANCE"])
    assert not can_perform("approve", ["FIELD_COORDINATOR"])
    assert not can_perform("receive_gift", ["SUPER_ADMIN"])  # system only
    assert funding_status(0, 1) is NeedStatus.OPEN


# ── prayer hubs and daylight saving ──────────────────────────────────────────
def test_new_york_local_hour_moves_in_utc_with_dst() -> None:
    # Tuesday 07:00 in New York: EST (UTC-5) in January, EDT (UTC-4) in July
    assert local_to_utc_slot(2, 7, "America/New_York", date(2027, 1, 5)) == (2, 12)
    assert local_to_utc_slot(2, 7, "America/New_York", date(2027, 7, 6)) == (2, 11)


def test_vancouver_follows_tz_database_not_a_hardcoded_offset() -> None:
    # tzdata 2026+ has British Columbia on UTC-7 all year (no more PST/PDT switch).
    # We never hard-code offsets, so the slot is the same in winter and summer.
    winter = local_to_utc_slot(2, 7, "America/Vancouver", date(2027, 1, 5))
    summer = local_to_utc_slot(2, 7, "America/Vancouver", date(2027, 7, 6))
    assert winter == summer == (2, 14)


def test_sydney_crosses_back_a_day_in_utc() -> None:
    # Monday 08:00 Sydney is Sunday in UTC (AEDT UTC+11 in January)
    assert local_to_utc_slot(1, 8, "Australia/Sydney", date(2027, 1, 4)) == (0, 21)


def test_lagos_has_no_dst() -> None:
    assert local_to_utc_slot(3, 6, "Africa/Lagos", date(2027, 1, 6)) == (3, 5)
    assert local_to_utc_slot(3, 6, "Africa/Lagos", date(2027, 7, 7)) == (3, 5)


@pytest.mark.parametrize(
    ("hour", "hub"),
    [
        (1, PrayerHub.SYDNEY),
        (7, PrayerHub.LAGOS),
        (13, PrayerHub.NEW_YORK),
        (23, PrayerHub.VANCOUVER),
    ],
)
def test_relay_active_hub(hour: int, hub: PrayerHub) -> None:
    assert active_hub(datetime(2027, 1, 4, hour, 30, tzinfo=UTC)).hub is hub


def test_next_handover_lagos_to_new_york_at_noon_utc() -> None:
    nxt, at = next_handover(datetime(2027, 1, 4, 9, 0, tzinfo=UTC))
    assert nxt.hub is PrayerHub.NEW_YORK
    assert at == datetime(2027, 1, 4, 12, 0, tzinfo=UTC)
