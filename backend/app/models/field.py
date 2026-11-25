"""Regions, missionaries and media."""

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, CreatedMixin, IdMixin, TimestampMixin
from app.models.enums import Currency, enum_col


class Region(IdMixin, Base):
    __tablename__ = "regions"

    name: Mapped[str] = mapped_column(String(80), unique=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Media(IdMixin, CreatedMixin, Base):
    __tablename__ = "media"

    provider: Mapped[str] = mapped_column(String(20), default="cloudinary")
    public_id: Mapped[str] = mapped_column(String(255), unique=True)
    url: Mapped[str] = mapped_column(String(500))
    kind: Mapped[str] = mapped_column(String(10))  # image | video | pdf
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    bytes: Mapped[int | None] = mapped_column(Integer)
    alt_text: Mapped[str | None] = mapped_column(String(300))
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    uploaded_by_id: Mapped[str | None] = mapped_column(String(32))


class Missionary(IdMixin, TimestampMixin, Base):
    __tablename__ = "missionaries"

    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), unique=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    public_name: Mapped[str] = mapped_column(String(120))  # alias when sensitive
    legal_name_enc: Mapped[str | None] = mapped_column(Text)
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    region_id: Mapped[str] = mapped_column(ForeignKey("regions.id"), index=True)
    field_location_enc: Mapped[str | None] = mapped_column(Text)
    public_location: Mapped[str | None] = mapped_column(String(120))
    bio: Mapped[str] = mapped_column(Text)
    ministry_focus: Mapped[str | None] = mapped_column(String(200))
    family_size: Mapped[int | None] = mapped_column(Integer)
    photo_media_id: Mapped[str | None] = mapped_column(ForeignKey("media.id"))
    phone_enc: Mapped[str | None] = mapped_column(Text)
    email_enc: Mapped[str | None] = mapped_column(Text)
    monthly_target_minor: Mapped[int] = mapped_column(BigInteger, default=0)
    monthly_target_currency: Mapped[Currency] = mapped_column(
        enum_col(Currency), default=Currency.NGN
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    joined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    region: Mapped[Region] = relationship(lazy="raise")
    photo: Mapped[Media | None] = relationship(lazy="raise")
