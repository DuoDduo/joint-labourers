"""Missionary Needs Board: contributory, Angel Tree model."""

from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, CreatedMixin, IdMixin, TimestampMixin
from app.models.enums import Currency, NeedCategory, NeedStatus, NeedUrgency, enum_col
from app.models.field import Media, Missionary, Region


class Need(IdMixin, TimestampMixin, Base):
    __tablename__ = "needs"
    __table_args__ = (
        CheckConstraint("target_minor > 0", name="target_positive"),
        CheckConstraint("raised_minor <= target_minor", name="raised_le_target"),
        Index("ix_needs_status_deadline", "status", "deadline_at"),
        Index("ix_needs_category_status", "category", "status"),
        Index("ix_needs_region_status", "region_id", "status"),
    )

    code: Mapped[str] = mapped_column(String(20), unique=True)  # "JLN-0042"
    slug: Mapped[str] = mapped_column(String(160), unique=True)
    title: Mapped[str] = mapped_column(String(160))
    summary: Mapped[str] = mapped_column(String(200))
    story: Mapped[str] = mapped_column(Text)
    category: Mapped[NeedCategory] = mapped_column(enum_col(NeedCategory))
    urgency: Mapped[NeedUrgency] = mapped_column(enum_col(NeedUrgency), default=NeedUrgency.NORMAL)
    missionary_id: Mapped[str | None] = mapped_column(ForeignKey("missionaries.id"))
    region_id: Mapped[str] = mapped_column(ForeignKey("regions.id"))
    target_minor: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[Currency] = mapped_column(enum_col(Currency), default=Currency.NGN)
    # Denormalised totals, updated in the same transaction as allocations
    raised_minor: Mapped[int] = mapped_column(BigInteger, default=0)
    reserved_minor: Mapped[int] = mapped_column(BigInteger, default=0)
    contributor_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[NeedStatus] = mapped_column(enum_col(NeedStatus), default=NeedStatus.DRAFT)
    opens_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    funded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    disbursed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    disbursed_minor: Mapped[int | None] = mapped_column(BigInteger)
    disbursement_proof_media_id: Mapped[str | None] = mapped_column(ForeignKey("media.id"))
    fulfilled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cover_media_id: Mapped[str | None] = mapped_column(ForeignKey("media.id"))
    cover_image_path: Mapped[str | None] = mapped_column(String(300))  # local/static fallback
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    approved_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancel_reason: Mapped[str | None] = mapped_column(String(500))
    version: Mapped[int] = mapped_column(Integer, default=0)  # optimistic lock for admin edits

    missionary: Mapped[Missionary | None] = relationship(lazy="raise")
    region: Mapped[Region] = relationship(lazy="raise")
    cover: Mapped[Media | None] = relationship(foreign_keys=[cover_media_id], lazy="raise")
    updates: Mapped[list["NeedUpdate"]] = relationship(
        lazy="raise", order_by="NeedUpdate.created_at.desc()"
    )


class NeedMedia(Base):
    __tablename__ = "need_media"

    need_id: Mapped[str] = mapped_column(
        ForeignKey("needs.id", ondelete="CASCADE"), primary_key=True
    )
    media_id: Mapped[str] = mapped_column(ForeignKey("media.id"), primary_key=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class NeedUpdate(IdMixin, CreatedMixin, Base):
    """Progress / fulfilment updates sent to contributors."""

    __tablename__ = "need_updates"

    need_id: Mapped[str] = mapped_column(ForeignKey("needs.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(Text)
    media_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False)
    notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class NeedStatusHistory(IdMixin, CreatedMixin, Base):
    __tablename__ = "need_status_history"

    need_id: Mapped[str] = mapped_column(ForeignKey("needs.id", ondelete="CASCADE"), index=True)
    from_status: Mapped[NeedStatus | None] = mapped_column(enum_col(NeedStatus))
    to_status: Mapped[NeedStatus] = mapped_column(enum_col(NeedStatus))
    action: Mapped[str] = mapped_column(String(40))
    actor_id: Mapped[str | None] = mapped_column(String(32))  # null = system
    note: Mapped[str | None] = mapped_column(String(500))
    meta: Mapped[dict[str, Any] | None] = mapped_column(JSON)


class NeedReservation(IdMixin, CreatedMixin, Base):
    """Holds capacity during a card checkout (30 min) or a bank pledge (7 days)."""

    __tablename__ = "need_reservations"
    __table_args__ = (Index("ix_need_res_live", "need_id", "released_at", "expires_at"),)

    need_id: Mapped[str] = mapped_column(ForeignKey("needs.id"))
    amount_minor: Mapped[int] = mapped_column(BigInteger)  # in need currency
    payment_id: Mapped[str | None] = mapped_column(String(32), unique=True)
    pledge_id: Mapped[str | None] = mapped_column(String(32), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
