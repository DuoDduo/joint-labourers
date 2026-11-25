"""Public read models + admin need inputs (camelCase JSON)."""

from datetime import datetime

from pydantic import EmailStr, Field

from app.models.enums import Currency, NeedCategory, NeedStatus, NeedUrgency, PrayerHub
from app.schemas.common import Minor, Schema


class RegionOut(Schema):
    name: str
    slug: str


class MissionaryMiniOut(Schema):
    public_name: str
    slug: str
    is_sensitive: bool
    public_location: str | None


class NeedCardOut(Schema):
    code: str
    slug: str
    title: str
    summary: str
    category: NeedCategory
    urgency: NeedUrgency
    region: RegionOut
    missionary: MissionaryMiniOut | None
    target_minor: Minor
    raised_minor: Minor
    available_minor: Minor
    currency: Currency
    percent: int
    contributor_count: int
    deadline_at: datetime | None
    status: NeedStatus
    cover_image: str | None


class NeedUpdateOut(Schema):
    title: str
    body: str
    is_final: bool
    created_at: datetime


class NeedDetailOut(NeedCardOut):
    story: str
    updates: list[NeedUpdateOut]


class NeedCreateIn(Schema):
    title: str = Field(min_length=5, max_length=160)
    summary: str = Field(min_length=10, max_length=200)
    story: str = Field(min_length=20)
    category: NeedCategory
    urgency: NeedUrgency = NeedUrgency.NORMAL
    region_slug: str
    missionary_slug: str | None = None
    target_minor: int = Field(gt=0)
    currency: Currency = Currency.NGN
    deadline_at: datetime | None = None


class NeedTransitionIn(Schema):
    action: str
    note: str | None = Field(default=None, max_length=500)
    deadline_at: datetime | None = None


class NeedAdminOut(Schema):
    id: str
    code: str
    status: NeedStatus
    version: int


class ImpactStatsOut(Schema):
    missionaries_supported: int
    needs_met_this_year: int
    needs_total_this_year: int
    prayer_hours_covered: int
    territories: int


class PrayerHubOut(Schema):
    hub: PrayerHub
    display_name: str
    timezone: str
    watch_start_utc: int
    watch_end_utc: int


class CoverageCellOut(Schema):
    weekday_utc: int
    hour_utc: int
    count: int


class CommitmentIn(Schema):
    full_name: str = Field(min_length=2, max_length=160)
    email: str | None = Field(default=None, max_length=320)
    phone: str | None = Field(default=None, max_length=32)
    hub: PrayerHub
    timezone: str = Field(max_length=64)
    local_weekday: int = Field(ge=0, le=6)
    local_hour: int = Field(ge=0, le=23)
    consent: bool


class WatchSummaryOut(Schema):
    slug: str
    title: str
    description: str | None
    banner_image: str | None
    starts_at: datetime
    ends_at: datetime
    round_count: int
    signup_count: int


class WatchSlotOut(Schema):
    id: str
    starts_at: datetime
    ends_at: datetime
    capacity: int | None
    taken: int
    is_full: bool


class WatchRoundOut(Schema):
    id: str
    label: str
    is_required: bool
    slots: list[WatchSlotOut]


class WatchDetailOut(WatchSummaryOut):
    rounds: list[WatchRoundOut]


class WatchSignupIn(Schema):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    phone: str = Field(pattern=r"^\+[1-9]\d{6,14}$")  # E.164, e.g. +2348012345678
    email: EmailStr
    hub: PrayerHub
    timezone: str = Field(max_length=64)
    slot_ids: list[str] = Field(min_length=1, max_length=20)
    consent: bool


class WatchSignupSlotOut(Schema):
    round_label: str
    starts_at: datetime
    ends_at: datetime


class WatchSignupOut(Schema):
    watch_title: str
    slots: list[WatchSignupSlotOut]
    meeting_url: str | None


class CommitmentOut(Schema):
    id: str
    hub: PrayerHub
    timezone: str
    local_weekday: int
    local_hour: int
    weekday_utc: int
    hour_utc: int
