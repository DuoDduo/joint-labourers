"""Prayer network across four hubs: Sydney, Lagos, New York, Vancouver."""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedMixin, IdMixin, utcnow
from app.models.enums import PrayerHub, PrayerRequestStatus, enum_col


class PrayerHubConfig(Base):
    """Seeded: SYDNEY 00-06 UTC, LAGOS 06-12, NEW_YORK 12-18, VANCOUVER 18-24."""

    __tablename__ = "prayer_hub_configs"

    hub: Mapped[PrayerHub] = mapped_column(enum_col(PrayerHub), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(60))
    timezone: Mapped[str] = mapped_column(String(64))  # IANA
    watch_start_utc: Mapped[int] = mapped_column(Integer)  # minutes after 00:00 UTC
    watch_end_utc: Mapped[int] = mapped_column(Integer)  # exclusive
    sort_order: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Intercessor(IdMixin, CreatedMixin, Base):
    __tablename__ = "intercessors"

    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), unique=True)
    full_name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str | None] = mapped_column(String(320), index=True)
    phone: Mapped[str | None] = mapped_column(String(32))
    hub: Mapped[PrayerHub] = mapped_column(enum_col(PrayerHub))
    timezone: Mapped[str] = mapped_column(String(64))
    church: Mapped[str | None] = mapped_column(String(160))
    consent_contact: Mapped[bool] = mapped_column(Boolean, default=False)


class PrayerCommitment(IdMixin, CreatedMixin, Base):
    """A weekly prayer hour anchored to LOCAL wall-clock time; UTC slot is derived."""

    __tablename__ = "prayer_commitments"
    __table_args__ = (
        CheckConstraint("local_weekday BETWEEN 0 AND 6", name="local_weekday"),
        CheckConstraint("local_hour BETWEEN 0 AND 23", name="local_hour"),
        CheckConstraint("weekday_utc BETWEEN 0 AND 6", name="weekday_utc"),
        CheckConstraint("hour_utc BETWEEN 0 AND 23", name="hour_utc"),
        Index("ix_prayer_commitments_utc", "weekday_utc", "hour_utc", "is_active"),
    )

    intercessor_id: Mapped[str] = mapped_column(
        ForeignKey("intercessors.id", ondelete="CASCADE"), index=True
    )
    hub: Mapped[PrayerHub] = mapped_column(ForeignKey("prayer_hub_configs.hub"))
    timezone: Mapped[str] = mapped_column(String(64))
    local_weekday: Mapped[int] = mapped_column(Integer)  # 0 = Sunday
    local_hour: Mapped[int] = mapped_column(Integer)
    weekday_utc: Mapped[int] = mapped_column(Integer)
    hour_utc: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    starts_on: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    ends_on: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_reminder_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PrayerWatch(IdMixin, CreatedMixin, Base):
    """Quarterly 3-hour prayer watches."""

    __tablename__ = "prayer_watches"

    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    capacity: Mapped[int | None] = mapped_column(Integer)
    meeting_url: Mapped[str | None] = mapped_column(String(300))


class PrayerWatchSignup(CreatedMixin, Base):
    __tablename__ = "prayer_watch_signups"

    watch_id: Mapped[str] = mapped_column(
        ForeignKey("prayer_watches.id", ondelete="CASCADE"), primary_key=True
    )
    intercessor_id: Mapped[str] = mapped_column(
        ForeignKey("intercessors.id", ondelete="CASCADE"), primary_key=True
    )


class PrayerRequest(IdMixin, CreatedMixin, Base):
    __tablename__ = "prayer_requests"
    __table_args__ = (Index("ix_prayer_requests_status_created", "status", "created_at"),)

    submitter_name: Mapped[str | None] = mapped_column(String(160))
    submitter_email: Mapped[str | None] = mapped_column(String(320))
    missionary_id: Mapped[str | None] = mapped_column(ForeignKey("missionaries.id"))
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(Text)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[PrayerRequestStatus] = mapped_column(
        enum_col(PrayerRequestStatus), default=PrayerRequestStatus.PENDING
    )
    prayed_count: Mapped[int] = mapped_column(Integer, default=0)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    testimony: Mapped[str | None] = mapped_column(Text)
    moderated_by_id: Mapped[str | None] = mapped_column(String(32))
    moderated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
