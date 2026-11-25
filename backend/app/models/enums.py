"""Domain enums. Stored as VARCHAR (portable across PostgreSQL and SQLite)."""

from enum import StrEnum

from sqlalchemy import Enum as SAEnum


def enum_col(e: type[StrEnum]) -> SAEnum:
    return SAEnum(
        e,
        native_enum=False,
        length=40,
        validate_strings=True,
        values_callable=lambda members: [m.value for m in members],
    )


class Role(StrEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    FINANCE = "FINANCE"
    FIELD_COORDINATOR = "FIELD_COORDINATOR"
    PRAYER_COORDINATOR = "PRAYER_COORDINATOR"
    HOUSING_COORDINATOR = "HOUSING_COORDINATOR"
    CONTENT_EDITOR = "CONTENT_EDITOR"
    MISSIONARY = "MISSIONARY"
    PARTNER = "PARTNER"


STAFF_ROLES = frozenset(Role) - {Role.MISSIONARY, Role.PARTNER}


class Currency(StrEnum):
    NGN = "NGN"
    USD = "USD"
    GBP = "GBP"
    EUR = "EUR"
    CAD = "CAD"
    AUD = "AUD"
    KES = "KES"


class NeedCategory(StrEnum):
    MEDICAL = "MEDICAL"
    EDUCATION = "EDUCATION"
    HOUSING = "HOUSING"
    FOOD_UPKEEP = "FOOD_UPKEEP"
    TRANSPORT = "TRANSPORT"
    MINISTRY_EQUIPMENT = "MINISTRY_EQUIPMENT"
    OUTREACH = "OUTREACH"
    EMERGENCY = "EMERGENCY"
    FAMILY_WELFARE = "FAMILY_WELFARE"
    OTHER = "OTHER"


class NeedStatus(StrEnum):
    DRAFT = "DRAFT"
    IN_REVIEW = "IN_REVIEW"
    OPEN = "OPEN"
    PARTIALLY_FUNDED = "PARTIALLY_FUNDED"
    FUNDED = "FUNDED"
    DISBURSED = "DISBURSED"
    FULFILLED = "FULFILLED"
    PAUSED = "PAUSED"
    EXPIRED = "EXPIRED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


PUBLIC_NEED_STATUSES = frozenset(
    {
        NeedStatus.OPEN,
        NeedStatus.PARTIALLY_FUNDED,
        NeedStatus.FUNDED,
        NeedStatus.DISBURSED,
        NeedStatus.FULFILLED,
        NeedStatus.EXPIRED,
    }
)


class NeedUrgency(StrEnum):
    NORMAL = "NORMAL"
    URGENT = "URGENT"
    CRITICAL = "CRITICAL"


class DesignationType(StrEnum):
    GENERAL_FUND = "GENERAL_FUND"
    MISSIONARY_SUPPORT = "MISSIONARY_SUPPORT"
    NEED = "NEED"
    EMERGENCY_RELIEF = "EMERGENCY_RELIEF"
    TRANSIT_HOUSING = "TRANSIT_HOUSING"


class DonationStatus(StrEnum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"


class PaymentProvider(StrEnum):
    PAYSTACK = "PAYSTACK"
    FLUTTERWAVE = "FLUTTERWAVE"
    BANK_TRANSFER = "BANK_TRANSFER"
    MANUAL = "MANUAL"


class PaymentMethod(StrEnum):
    CARD = "CARD"
    USSD = "USSD"
    BANK_TRANSFER = "BANK_TRANSFER"
    MOBILE_MONEY = "MOBILE_MONEY"
    CASH = "CASH"
    OTHER = "OTHER"


class PaymentStatus(StrEnum):
    INITIATED = "INITIATED"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    ABANDONED = "ABANDONED"
    REVERSED = "REVERSED"


class PledgeStatus(StrEnum):
    AWAITING_TRANSFER = "AWAITING_TRANSFER"
    FULFILLED = "FULFILLED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class RecurringStatus(StrEnum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    PAUSED = "PAUSED"
    LAPSED = "LAPSED"
    CANCELLED = "CANCELLED"


class PartnerTier(StrEnum):
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    CUSTOM = "CUSTOM"


class PrayerHub(StrEnum):
    SYDNEY = "SYDNEY"
    LAGOS = "LAGOS"
    NEW_YORK = "NEW_YORK"
    VANCOUVER = "VANCOUVER"


class PrayerRequestStatus(StrEnum):
    PENDING = "PENDING"
    PUBLISHED = "PUBLISHED"
    ANSWERED = "ANSWERED"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"


class HousingRequestStatus(StrEnum):
    NEW = "NEW"
    MATCHING = "MATCHING"
    MATCHED = "MATCHED"
    COMPLETED = "COMPLETED"
    DECLINED = "DECLINED"
    CANCELLED = "CANCELLED"


class HostStatus(StrEnum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    REJECTED = "REJECTED"


class ContactCategory(StrEnum):
    GENERAL = "GENERAL"
    MISSIONARY_SEEKING_SUPPORT = "MISSIONARY_SEEKING_SUPPORT"
    CHURCH_PARTNERSHIP = "CHURCH_PARTNERSHIP"
    MEDIA_TESTIMONIES = "MEDIA_TESTIMONIES"
    GIVING_QUESTION = "GIVING_QUESTION"


class NotificationChannel(StrEnum):
    EMAIL = "EMAIL"
    SMS = "SMS"
    WHATSAPP = "WHATSAPP"


class NotificationStatus(StrEnum):
    QUEUED = "QUEUED"
    SENT = "SENT"
    FAILED = "FAILED"
    BOUNCED = "BOUNCED"
