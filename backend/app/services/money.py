"""Money helpers. Amounts are integers in minor units; never floats."""

from decimal import ROUND_HALF_UP, Decimal

from app.models.enums import Currency

MINOR_UNITS: dict[Currency, int] = {c: 2 for c in Currency}


def to_minor(amount: Decimal | int | str, currency: Currency) -> int:
    factor = Decimal(10) ** MINOR_UNITS[currency]
    return int((Decimal(str(amount)) * factor).quantize(Decimal(1), rounding=ROUND_HALF_UP))


def from_minor(amount_minor: int, currency: Currency) -> Decimal:
    return Decimal(amount_minor) / (Decimal(10) ** MINOR_UNITS[currency])


def percent_funded(raised_minor: int, target_minor: int) -> int:
    """Whole-number percent, floored, capped at 100 (99.6% shows 99 until truly funded)."""
    if target_minor <= 0:
        return 0
    return min(100, (raised_minor * 100) // target_minor)


def available_minor(target_minor: int, raised_minor: int, reserved_minor: int) -> int:
    return max(0, target_minor - raised_minor - reserved_minor)


def convert_minor(amount_minor: int, rate: Decimal) -> int:
    """Convert minor units with a rate (both currencies have 2 decimals today)."""
    return int((Decimal(amount_minor) * rate).quantize(Decimal(1), rounding=ROUND_HALF_UP))
