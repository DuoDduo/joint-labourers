"""Donations, the allocation ledger, payments, pledges, recurring gifts and FX.

Money is always an integer in MINOR units (kobo / cents / pence) plus a currency.
`donation_allocations` is append-only: refunds are negative rows, nothing is deleted.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedMixin, IdMixin, TimestampMixin
from app.models.enums import (
    Currency,
    DesignationType,
    DonationStatus,
    PartnerTier,
    PaymentMethod,
    PaymentProvider,
    PaymentStatus,
    PledgeStatus,
    RecurringStatus,
    enum_col,
)


class BankAccount(IdMixin, Base):
    __tablename__ = "bank_accounts"

    label: Mapped[str] = mapped_column(String(80))
    bank_name: Mapped[str] = mapped_column(String(120))
    account_name: Mapped[str] = mapped_column(String(160))
    account_number: Mapped[str] = mapped_column(String(40))
    currency: Mapped[Currency] = mapped_column(enum_col(Currency))
    swift_code: Mapped[str | None] = mapped_column(String(20))
    sort_code: Mapped[str | None] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class RecurringGift(IdMixin, TimestampMixin, Base):
    __tablename__ = "recurring_gifts"
    __table_args__ = (Index("ix_recurring_status_next", "status", "next_charge_at"),)

    donor_id: Mapped[str] = mapped_column(ForeignKey("donors.id"))
    designation: Mapped[DesignationType] = mapped_column(enum_col(DesignationType))
    missionary_id: Mapped[str | None] = mapped_column(ForeignKey("missionaries.id"))
    tier: Mapped[PartnerTier | None] = mapped_column(enum_col(PartnerTier))
    amount_minor: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[Currency] = mapped_column(enum_col(Currency))
    interval: Mapped[str] = mapped_column(String(20), default="monthly")
    provider: Mapped[PaymentProvider] = mapped_column(enum_col(PaymentProvider))
    provider_plan_id: Mapped[str | None] = mapped_column(String(120))
    provider_subscription_id: Mapped[str | None] = mapped_column(String(120), unique=True)
    provider_customer_id: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[RecurringStatus] = mapped_column(
        enum_col(RecurringStatus), default=RecurringStatus.PENDING
    )
    failed_attempts: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    next_charge_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    paused_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancel_reason: Mapped[str | None] = mapped_column(String(300))


class Pledge(IdMixin, TimestampMixin, Base):
    """Bank-transfer pledge (Angel Tree 'pledge then transfer')."""

    __tablename__ = "pledges"
    __table_args__ = (Index("ix_pledges_status_expires", "status", "expires_at"),)

    reference: Mapped[str] = mapped_column(String(30), unique=True)  # "JLN-0042-8F3K"
    donor_id: Mapped[str] = mapped_column(ForeignKey("donors.id"))
    need_id: Mapped[str | None] = mapped_column(ForeignKey("needs.id"))
    designation: Mapped[DesignationType] = mapped_column(enum_col(DesignationType))
    missionary_id: Mapped[str | None] = mapped_column(ForeignKey("missionaries.id"))
    amount_minor: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[Currency] = mapped_column(enum_col(Currency))
    bank_account_id: Mapped[str] = mapped_column(ForeignKey("bank_accounts.id"))
    status: Mapped[PledgeStatus] = mapped_column(
        enum_col(PledgeStatus), default=PledgeStatus.AWAITING_TRANSFER
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reminded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fulfilled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Donation(IdMixin, TimestampMixin, Base):
    __tablename__ = "donations"
    __table_args__ = (
        Index("ix_donations_donor_created", "donor_id", "created_at"),
        Index("ix_donations_status_created", "status", "created_at"),
    )

    reference: Mapped[str] = mapped_column(String(30), unique=True)  # "JLD-2027-000123"
    donor_id: Mapped[str] = mapped_column(ForeignKey("donors.id"))
    amount_minor: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[Currency] = mapped_column(enum_col(Currency))
    fee_covered_minor: Mapped[int] = mapped_column(BigInteger, default=0)
    status: Mapped[DonationStatus] = mapped_column(
        enum_col(DonationStatus), default=DonationStatus.PENDING
    )
    designation: Mapped[DesignationType] = mapped_column(enum_col(DesignationType))
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[str | None] = mapped_column(Text)  # encouragement / scripture
    team_name: Mapped[str | None] = mapped_column(String(160))
    recurring_gift_id: Mapped[str | None] = mapped_column(ForeignKey("recurring_gifts.id"))
    pledge_id: Mapped[str | None] = mapped_column(ForeignKey("pledges.id"), unique=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    receipt_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    source: Mapped[str | None] = mapped_column(String(80))


class DonationAllocation(IdMixin, CreatedMixin, Base):
    __tablename__ = "donation_allocations"
    __table_args__ = (Index("ix_alloc_designation_created", "designation", "created_at"),)

    donation_id: Mapped[str] = mapped_column(ForeignKey("donations.id"), index=True)
    designation: Mapped[DesignationType] = mapped_column(enum_col(DesignationType))
    need_id: Mapped[str | None] = mapped_column(ForeignKey("needs.id"), index=True)
    missionary_id: Mapped[str | None] = mapped_column(ForeignKey("missionaries.id"), index=True)
    amount_minor: Mapped[int] = mapped_column(BigInteger)  # donation currency; negative = refund
    currency: Mapped[Currency] = mapped_column(enum_col(Currency))
    converted_minor: Mapped[int | None] = mapped_column(BigInteger)  # need/target currency
    converted_currency: Mapped[Currency | None] = mapped_column(enum_col(Currency))
    fx_rate: Mapped[Decimal | None] = mapped_column(Numeric(18, 8))
    fx_source: Mapped[str | None] = mapped_column(String(40))
    fx_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reason: Mapped[str | None] = mapped_column(String(40))  # allocation | surplus_overflow | ...


class Payment(IdMixin, TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        UniqueConstraint("provider", "provider_reference", name="uq_payments_provider_ref"),
        Index("ix_payments_status_created", "status", "created_at"),
    )

    donation_id: Mapped[str] = mapped_column(ForeignKey("donations.id"), index=True)
    provider: Mapped[PaymentProvider] = mapped_column(enum_col(PaymentProvider))
    method: Mapped[PaymentMethod | None] = mapped_column(enum_col(PaymentMethod))
    provider_reference: Mapped[str] = mapped_column(String(60))  # "JLP-…"
    provider_txn_id: Mapped[str | None] = mapped_column(String(120))
    amount_minor: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[Currency] = mapped_column(enum_col(Currency))
    fee_minor: Mapped[int | None] = mapped_column(BigInteger)
    settled_minor: Mapped[int | None] = mapped_column(BigInteger)
    settled_currency: Mapped[Currency | None] = mapped_column(enum_col(Currency))
    status: Mapped[PaymentStatus] = mapped_column(
        enum_col(PaymentStatus), default=PaymentStatus.INITIATED
    )
    failure_reason: Mapped[str | None] = mapped_column(String(300))
    raw_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)  # never card data
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class WebhookEvent(IdMixin, Base):
    """Idempotency record for gateway webhooks."""

    __tablename__ = "webhook_events"
    __table_args__ = (UniqueConstraint("provider", "event_id", name="uq_webhook_provider_event"),)

    provider: Mapped[PaymentProvider] = mapped_column(enum_col(PaymentProvider))
    event_id: Mapped[str] = mapped_column(String(120))
    event_type: Mapped[str] = mapped_column(String(80))
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error: Mapped[str | None] = mapped_column(Text)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class BankStatementLine(IdMixin, CreatedMixin, Base):
    __tablename__ = "bank_statement_lines"

    bank_account_id: Mapped[str] = mapped_column(ForeignKey("bank_accounts.id"))
    value_date: Mapped[date] = mapped_column(Date)
    narration: Mapped[str] = mapped_column(String(500))
    amount_minor: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[Currency] = mapped_column(enum_col(Currency))
    matched_pledge_id: Mapped[str | None] = mapped_column(ForeignKey("pledges.id"), index=True)
    matched_by_id: Mapped[str | None] = mapped_column(String(32))
    matched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    import_batch: Mapped[str] = mapped_column(String(40))


class PartnerTierPrice(IdMixin, Base):
    __tablename__ = "partner_tier_prices"
    __table_args__ = (UniqueConstraint("tier", "currency", name="uq_tier_currency"),)

    tier: Mapped[PartnerTier] = mapped_column(enum_col(PartnerTier))
    currency: Mapped[Currency] = mapped_column(enum_col(Currency))
    amount_minor: Mapped[int] = mapped_column(BigInteger)
    description: Mapped[str] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class FxRate(IdMixin, Base):
    __tablename__ = "fx_rates"
    __table_args__ = (UniqueConstraint("base", "quote", "as_of", name="uq_fx_base_quote_asof"),)

    base: Mapped[Currency] = mapped_column(enum_col(Currency))
    quote: Mapped[Currency] = mapped_column(enum_col(Currency))
    rate: Mapped[Decimal] = mapped_column(Numeric(18, 8))
    source: Mapped[str] = mapped_column(String(40))
    as_of: Mapped[datetime] = mapped_column(DateTime(timezone=True))
