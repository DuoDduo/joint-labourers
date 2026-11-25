"""Transit housing, contact desk, gallery, reports, content blocks, settings, notifications."""

from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedMixin, IdMixin, TimestampMixin, utcnow
from app.models.enums import (
    ContactCategory,
    HostStatus,
    HousingRequestStatus,
    NotificationChannel,
    NotificationStatus,
    enum_col,
)


class HostFamily(IdMixin, CreatedMixin, Base):
    __tablename__ = "host_families"
    __table_args__ = (Index("ix_hosts_city_status", "city", "status"),)

    contact_name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(320))
    phone_enc: Mapped[str] = mapped_column(Text)
    city: Mapped[str] = mapped_column(String(80))
    address_enc: Mapped[str] = mapped_column(Text)  # never public
    rooms: Mapped[int] = mapped_column(Integer)
    max_guests: Mapped[int] = mapped_column(Integer)
    amenities: Mapped[list[str]] = mapped_column(JSON, default=list)
    church: Mapped[str] = mapped_column(String(160))
    pastor_reference: Mapped[str] = mapped_column(String(300))
    status: Mapped[HostStatus] = mapped_column(
        enum_col(HostStatus), default=HostStatus.PENDING_VERIFICATION
    )
    verified_by_id: Mapped[str | None] = mapped_column(String(32))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)


class HousingRequest(IdMixin, TimestampMixin, Base):
    __tablename__ = "housing_requests"
    __table_args__ = (
        CheckConstraint("depart_on >= arrive_on", name="dates"),
        Index("ix_housing_status_arrive", "status", "arrive_on"),
    )

    reference: Mapped[str] = mapped_column(String(20), unique=True)  # "JLH-0007"
    requester_name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str | None] = mapped_column(String(320))
    phone_enc: Mapped[str] = mapped_column(Text)
    missionary_id: Mapped[str | None] = mapped_column(ForeignKey("missionaries.id"))
    city: Mapped[str] = mapped_column(String(80))
    arrive_on: Mapped[date] = mapped_column(Date)
    depart_on: Mapped[date] = mapped_column(Date)
    adults: Mapped[int] = mapped_column(Integer)
    children: Mapped[int] = mapped_column(Integer, default=0)
    route: Mapped[str | None] = mapped_column(String(300))
    purpose: Mapped[str | None] = mapped_column(Text)
    status: Mapped[HousingRequestStatus] = mapped_column(
        enum_col(HousingRequestStatus), default=HousingRequestStatus.NEW
    )
    host_id: Mapped[str | None] = mapped_column(ForeignKey("host_families.id"))
    coordinator_note: Mapped[str | None] = mapped_column(Text)


class ContactMessage(IdMixin, CreatedMixin, Base):
    __tablename__ = "contact_messages"
    __table_args__ = (Index("ix_contact_category_resolved", "category", "is_resolved"),)

    category: Mapped[ContactCategory] = mapped_column(enum_col(ContactCategory))
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(320))
    phone: Mapped[str | None] = mapped_column(String(32))
    subject: Mapped[str | None] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    assigned_to: Mapped[str | None] = mapped_column(String(32))


class Album(IdMixin, Base):
    __tablename__ = "albums"

    title: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(160), unique=True)
    category: Mapped[str] = mapped_column(String(80))
    description: Mapped[str | None] = mapped_column(Text)
    cover_media_id: Mapped[str | None] = mapped_column(ForeignKey("media.id"))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AlbumItem(Base):
    __tablename__ = "album_items"

    album_id: Mapped[str] = mapped_column(
        ForeignKey("albums.id", ondelete="CASCADE"), primary_key=True
    )
    media_id: Mapped[str] = mapped_column(ForeignKey("media.id"), primary_key=True)
    caption: Mapped[str | None] = mapped_column(String(300))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Report(IdMixin, CreatedMixin, Base):
    __tablename__ = "reports"

    title: Mapped[str] = mapped_column(String(160))
    period: Mapped[str] = mapped_column(String(10))  # "2027-Q1"
    file_url: Mapped[str] = mapped_column(String(500))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ContentBlock(Base):
    """Editable content: hero, impact stats, FAQs, 'where your money goes', charter."""

    __tablename__ = "content_blocks"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    data: Mapped[dict[str, Any]] = mapped_column(JSON)
    updated_by: Mapped[str | None] = mapped_column(String(32))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[Any] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class Notification(IdMixin, CreatedMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_status_created", "status", "created_at"),)

    channel: Mapped[NotificationChannel] = mapped_column(enum_col(NotificationChannel))
    to: Mapped[str] = mapped_column(String(320))
    template: Mapped[str] = mapped_column(String(60))
    data: Mapped[dict[str, Any]] = mapped_column(JSON)
    status: Mapped[NotificationStatus] = mapped_column(
        enum_col(NotificationStatus), default=NotificationStatus.QUEUED
    )
    provider_msg_id: Mapped[str | None] = mapped_column(String(120))
    error: Mapped[str | None] = mapped_column(Text)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
