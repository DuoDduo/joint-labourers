"""Import every model so Base.metadata is complete (used by Alembic and tests)."""

from app.db.base import Base
from app.models.community import (
    Album,
    AlbumItem,
    ContactMessage,
    ContentBlock,
    HostFamily,
    HousingRequest,
    Notification,
    Report,
    Setting,
)
from app.models.field import Media, Missionary, Region
from app.models.giving import (
    BankAccount,
    BankStatementLine,
    Donation,
    DonationAllocation,
    FxRate,
    PartnerTierPrice,
    Payment,
    Pledge,
    RecurringGift,
    WebhookEvent,
)
from app.models.identity import AuditLog, Donor, MagicLink, RefreshToken, User
from app.models.needs import Need, NeedMedia, NeedReservation, NeedStatusHistory, NeedUpdate
from app.models.prayer import (
    Intercessor,
    PrayerCommitment,
    PrayerHubConfig,
    PrayerRequest,
    PrayerWatch,
    PrayerWatchSignup,
)

__all__ = [
    "Album",
    "AlbumItem",
    "AuditLog",
    "BankAccount",
    "BankStatementLine",
    "Base",
    "ContactMessage",
    "ContentBlock",
    "Donation",
    "DonationAllocation",
    "Donor",
    "FxRate",
    "HostFamily",
    "HousingRequest",
    "Intercessor",
    "MagicLink",
    "Media",
    "Missionary",
    "Need",
    "NeedMedia",
    "NeedReservation",
    "NeedStatusHistory",
    "NeedUpdate",
    "Notification",
    "PartnerTierPrice",
    "Payment",
    "Pledge",
    "PrayerCommitment",
    "PrayerHubConfig",
    "PrayerRequest",
    "PrayerWatch",
    "PrayerWatchSignup",
    "RecurringGift",
    "RefreshToken",
    "Region",
    "Report",
    "Setting",
    "User",
    "WebhookEvent",
]
