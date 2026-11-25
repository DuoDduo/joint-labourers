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
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

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
    """A prayer-watch campaign people sign up for (e.g. the quarterly 24-hour cycle).

    Modelled on a campaign sign-up page: banner, title, one form. A watch has one or
    more rounds (e.g. "Day 1", "October"); each round has shifts; a person picks one
    shift in every required round.
    """

    __tablename__ = "prayer_watches"

    slug: Mapped[str] = mapped_column(String(120), unique=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)
    banner_image: Mapped[str | None] = mapped_column(String(300))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    meeting_url: Mapped[str | None] = mapped_column(String(300))
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)

    rounds: Mapped[list["PrayerWatchRound"]] = relationship(
        lazy="raise", order_by="PrayerWatchRound.sort_order"
    )


class PrayerWatchRound(IdMixin, Base):
    __tablename__ = "prayer_watch_rounds"

    watch_id: Mapped[str] = mapped_column(
        ForeignKey("prayer_watches.id", ondelete="CASCADE"), index=True
    )
    label: Mapped[str] = mapped_column(String(120))  # "24-hour cycle", "October"
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)

    slots: Mapped[list["PrayerWatchSlot"]] = relationship(
        lazy="raise", order_by="PrayerWatchSlot.starts_at"
    )


class PrayerWatchSlot(IdMixin, Base):
    """One shift, e.g. 06:00-09:00 UTC. Shown to each person in their hub's local time."""

    __tablename__ = "prayer_watch_slots"
    __table_args__ = (CheckConstraint("ends_at > starts_at", name="slot_order"),)

    round_id: Mapped[str] = mapped_column(
        ForeignKey("prayer_watch_rounds.id", ondelete="CASCADE"), index=True
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    capacity: Mapped[int | None] = mapped_column(Integer)  # None = unlimited


class PrayerWatchSignup(IdMixin, CreatedMixin, Base):
    __tablename__ = "prayer_watch_signups"
    __table_args__ = (
        UniqueConstraint("slot_id", "intercessor_id", name="uq_watch_signup_slot_person"),
    )

    watch_id: Mapped[str] = mapped_column(
        ForeignKey("prayer_watches.id", ondelete="CASCADE"), index=True
    )
    slot_id: Mapped[str] = mapped_column(
        ForeignKey("prayer_watch_slots.id", ondelete="CASCADE"), index=True
    )
    intercessor_id: Mapped[str] = mapped_column(
        ForeignKey("intercessors.id", ondelete="CASCADE"), index=True
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
