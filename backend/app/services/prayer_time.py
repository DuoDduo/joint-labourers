"""Prayer-hub time logic. IANA zones only; never fixed offsets like 'EST'.

Weekday convention everywhere: 0 = Sunday ... 6 = Saturday.
"""

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.models.enums import PrayerHub


@dataclass(frozen=True)
class HubWindow:
    hub: PrayerHub
    display_name: str
    timezone: str
    watch_start_utc: int  # minutes after 00:00 UTC
    watch_end_utc: int  # exclusive
    sort_order: int


# Relay: each hub prays through its own daytime and passes the watch on.
DEFAULT_HUBS: tuple[HubWindow, ...] = (
    HubWindow(PrayerHub.SYDNEY, "Sydney", "Australia/Sydney", 0, 360, 1),
    HubWindow(PrayerHub.LAGOS, "Lagos", "Africa/Lagos", 360, 720, 2),
    HubWindow(PrayerHub.NEW_YORK, "New York", "America/New_York", 720, 1080, 3),
    HubWindow(PrayerHub.VANCOUVER, "Vancouver", "America/Vancouver", 1080, 1440, 4),
)


def sunday_weekday(d: date | datetime) -> int:
    return (d.weekday() + 1) % 7


def local_to_utc_slot(
    local_weekday: int, local_hour: int, tz: str, reference: date | None = None
) -> tuple[int, int]:
    """UTC (weekday, hour) of the next occurrence of a local weekly slot on/after `reference`.

    The answer depends on the date because of daylight saving, which is why
    commitments are re-derived by the dst-rebalance job.
    """
    if not (0 <= local_weekday <= 6 and 0 <= local_hour <= 23):
        raise ValueError("weekday must be 0-6 and hour 0-23")
    zone = ZoneInfo(tz)
    ref = reference or datetime.now(zone).date()
    days_ahead = (local_weekday - sunday_weekday(ref)) % 7
    local_dt = datetime.combine(ref + timedelta(days=days_ahead), time(local_hour), tzinfo=zone)
    utc_dt = local_dt.astimezone(UTC)
    return sunday_weekday(utc_dt), utc_dt.hour


def active_hub(now_utc: datetime, hubs: tuple[HubWindow, ...] = DEFAULT_HUBS) -> HubWindow:
    minute = now_utc.astimezone(UTC).hour * 60 + now_utc.astimezone(UTC).minute
    for hub in hubs:
        if hub.watch_start_utc <= minute < hub.watch_end_utc:
            return hub
    return hubs[0]


def next_handover(
    now_utc: datetime, hubs: tuple[HubWindow, ...] = DEFAULT_HUBS
) -> tuple[HubWindow, datetime]:
    """The hub that takes the watch next, and when (UTC)."""
    now = now_utc.astimezone(UTC)
    current = active_hub(now, hubs)
    ordered = sorted(hubs, key=lambda h: h.watch_start_utc)
    nxt = ordered[(ordered.index(current) + 1) % len(ordered)]
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    at = midnight + timedelta(minutes=current.watch_end_utc)
    return nxt, at
