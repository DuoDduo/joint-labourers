"""Need status machine. All status changes go through `next_status`.

draft -> in_review -> open -> partially_funded -> funded -> disbursed -> fulfilled
side states: paused, expired, closed (reallocated), cancelled.
"""

from dataclasses import dataclass

from app.models.enums import NeedStatus as S
from app.models.enums import Role as R

SYSTEM = "SYSTEM"
_ADMINS = frozenset({R.SUPER_ADMIN, R.ADMIN})
_FIELD = _ADMINS | {R.FIELD_COORDINATOR}
_FINANCE = _ADMINS | {R.FINANCE}
_LIVE = frozenset({S.OPEN, S.PARTIALLY_FUNDED})


class InvalidTransitionError(Exception):
    def __init__(self, action: str, current: S) -> None:
        super().__init__(f"Cannot '{action}' a need that is {current.value}")
        self.action, self.current = action, current


@dataclass(frozen=True)
class Rule:
    sources: frozenset[S]
    target: S | None  # None = depends on funding (open / partially_funded / funded)
    roles: frozenset[str]


RULES: dict[str, Rule] = {
    "submit": Rule(frozenset({S.DRAFT}), S.IN_REVIEW, _FIELD),
    "reject": Rule(frozenset({S.IN_REVIEW}), S.DRAFT, _ADMINS),
    "approve": Rule(frozenset({S.IN_REVIEW}), S.OPEN, _ADMINS),
    "pause": Rule(_LIVE, S.PAUSED, _ADMINS),
    "resume": Rule(frozenset({S.PAUSED}), None, _ADMINS),
    "extend": Rule(frozenset({S.EXPIRED}), None, _FIELD),
    # Deliver what was raised: becomes FUNDED so finance can disburse it.
    "close_partial": Rule(frozenset({S.EXPIRED}), S.FUNDED, _ADMINS),
    # Move what was raised to the General Fund.
    "reallocate": Rule(frozenset({S.EXPIRED}), S.CLOSED, _ADMINS),
    "mark_disbursed": Rule(frozenset({S.FUNDED}), S.DISBURSED, _FINANCE),
    "fulfil": Rule(frozenset({S.DISBURSED}), S.FULFILLED, _FIELD),
    "cancel": Rule(
        frozenset({S.DRAFT, S.IN_REVIEW, S.OPEN, S.PARTIALLY_FUNDED, S.PAUSED, S.EXPIRED}),
        S.CANCELLED,
        _ADMINS,
    ),
    # System-only (payments and scheduled jobs)
    "receive_gift": Rule(_LIVE, None, frozenset({SYSTEM})),
    "expire": Rule(_LIVE, S.EXPIRED, frozenset({SYSTEM})),
}

STAFF_ACTIONS = frozenset(a for a, r in RULES.items() if SYSTEM not in r.roles)


def funding_status(raised_minor: int, target_minor: int) -> S:
    if raised_minor >= target_minor:
        return S.FUNDED
    return S.PARTIALLY_FUNDED if raised_minor > 0 else S.OPEN


def can_perform(action: str, roles: list[str] | frozenset[str]) -> bool:
    rule = RULES.get(action)
    return rule is not None and bool(rule.roles & set(roles))


def next_status(current: S, action: str, raised_minor: int, target_minor: int) -> S:
    rule = RULES.get(action)
    if rule is None or current not in rule.sources:
        raise InvalidTransitionError(action, current)
    if rule.target is not None:
        return rule.target
    return funding_status(raised_minor, target_minor)
