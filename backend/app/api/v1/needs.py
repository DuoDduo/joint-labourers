"""Missionary Needs Board: public listing/detail + staff create and transitions."""

import re
from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, require_roles
from app.core.errors import ProblemError, not_found
from app.models.enums import PUBLIC_NEED_STATUSES, NeedCategory, NeedStatus, Role
from app.models.field import Missionary, Region
from app.models.identity import AuditLog, User
from app.models.needs import Need, NeedStatusHistory
from app.schemas.common import Page, PageMeta
from app.schemas.public import (
    MissionaryMiniOut,
    NeedAdminOut,
    NeedCardOut,
    NeedCreateIn,
    NeedDetailOut,
    NeedTransitionIn,
    NeedUpdateOut,
    RegionOut,
)
from app.services.money import available_minor, percent_funded
from app.services.need_states import (
    STAFF_ACTIONS,
    InvalidTransitionError,
    can_perform,
    next_status,
)

router = APIRouter(tags=["needs"])

_LIVE = (NeedStatus.OPEN, NeedStatus.PARTIALLY_FUNDED)
_DONE = (NeedStatus.FUNDED, NeedStatus.DISBURSED, NeedStatus.FULFILLED)
_FIELD_ROLES = (Role.SUPER_ADMIN, Role.ADMIN, Role.FIELD_COORDINATOR)
_ANY_NEED_ROLE = (*_FIELD_ROLES, Role.FINANCE)


def _cover(need: Need) -> str | None:
    if need.cover is not None:
        return need.cover.url
    return need.cover_image_path


def _card_fields(need: Need) -> dict[str, object]:
    m = need.missionary
    return {
        "code": need.code,
        "slug": need.slug,
        "title": need.title,
        "summary": need.summary,
        "category": need.category,
        "urgency": need.urgency,
        "region": RegionOut.model_validate(need.region),
        "missionary": MissionaryMiniOut.model_validate(m) if m else None,
        "target_minor": need.target_minor,
        "raised_minor": need.raised_minor,
        "available_minor": available_minor(
            need.target_minor, need.raised_minor, need.reserved_minor
        ),
        "currency": need.currency,
        "percent": percent_funded(need.raised_minor, need.target_minor),
        "contributor_count": need.contributor_count,
        "deadline_at": need.deadline_at,
        "status": need.status,
        "cover_image": _cover(need),
    }


def _with_refs():  # type: ignore[no-untyped-def]
    return (
        selectinload(Need.region),
        selectinload(Need.missionary),
        selectinload(Need.cover),
    )


@router.get("/needs", response_model=Page[NeedCardOut])
async def list_needs(
    session: SessionDep,
    status: Literal["live", "fulfilled", "all"] = "live",
    category: NeedCategory | None = None,
    region: str | None = None,
    almost_there: Annotated[bool, Query(alias="almostThere")] = False,
    sort: Literal["deadline", "newest", "progress"] = "deadline",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=50)] = 12,
) -> Page[NeedCardOut]:
    statuses = {"live": _LIVE, "fulfilled": _DONE, "all": tuple(PUBLIC_NEED_STATUSES)}[status]
    q = select(Need).where(Need.status.in_(statuses))
    if category:
        q = q.where(Need.category == category)
    if region:
        q = q.join(Region, Region.id == Need.region_id).where(Region.slug == region)
    if almost_there:
        q = q.where(Need.raised_minor * 4 >= Need.target_minor * 3)
    total = await session.scalar(select(func.count()).select_from(q.subquery())) or 0
    order = {
        "deadline": (Need.deadline_at.is_(None), Need.deadline_at.asc()),
        "newest": (Need.created_at.desc(),),
        "progress": ((Need.raised_minor * 1000 / Need.target_minor).desc(),),
    }[sort]
    rows = await session.scalars(
        q.options(*_with_refs()).order_by(*order).offset((page - 1) * page_size).limit(page_size)
    )
    return Page[NeedCardOut](
        data=[NeedCardOut.model_validate(_card_fields(n)) for n in rows],
        meta=PageMeta(page=page, page_size=page_size, total=total),
    )


@router.get("/needs/{code}", response_model=NeedDetailOut)
async def get_need(code: str, session: SessionDep) -> NeedDetailOut:
    need = await session.scalar(
        select(Need)
        .where(Need.code == code.upper(), Need.status.in_(PUBLIC_NEED_STATUSES))
        .options(*_with_refs(), selectinload(Need.updates))
    )
    if need is None:
        raise not_found("Need")
    return NeedDetailOut.model_validate(
        {
            **_card_fields(need),
            "story": need.story,
            "updates": [NeedUpdateOut.model_validate(u) for u in need.updates],
        }
    )


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:120]


async def _next_code(session: SessionDep) -> str:
    n = (await session.scalar(select(func.count(Need.id))) or 0) + 1
    while await session.scalar(select(Need.id).where(Need.code == f"JLN-{n:04d}")):
        n += 1
    return f"JLN-{n:04d}"


@router.post("/admin/needs", response_model=NeedAdminOut, status_code=201)
async def create_need(
    body: NeedCreateIn,
    session: SessionDep,
    user: Annotated[User, Depends(require_roles(*_FIELD_ROLES))],
) -> Need:
    region = await session.scalar(select(Region).where(Region.slug == body.region_slug))
    if region is None:
        raise ProblemError(422, "unknown-region", "Region not found")
    missionary_id = None
    if body.missionary_slug:
        missionary_id = await session.scalar(
            select(Missionary.id).where(Missionary.slug == body.missionary_slug)
        )
        if missionary_id is None:
            raise ProblemError(422, "unknown-missionary", "Missionary not found")
    code = await _next_code(session)
    need = Need(
        code=code,
        slug=f"{code.lower()}-{_slugify(body.title)}",
        title=body.title,
        summary=body.summary,
        story=body.story,
        category=body.category,
        urgency=body.urgency,
        region_id=region.id,
        missionary_id=missionary_id,
        target_minor=body.target_minor,
        currency=body.currency,
        deadline_at=body.deadline_at,
        created_by_id=user.id,
    )
    session.add(need)
    await session.flush()
    session.add(
        NeedStatusHistory(
            need_id=need.id, to_status=NeedStatus.DRAFT, action="create", actor_id=user.id
        )
    )
    session.add(AuditLog(actor_id=user.id, action="need.create", entity="need", entity_id=need.id))
    await session.commit()
    return need


@router.post("/admin/needs/{need_id}/transition", response_model=NeedAdminOut)
async def transition_need(
    need_id: str,
    body: NeedTransitionIn,
    session: SessionDep,
    user: Annotated[User, Depends(require_roles(*_ANY_NEED_ROLE))],
) -> Need:
    if body.action not in STAFF_ACTIONS:
        raise ProblemError(422, "unknown-action", f"Unknown action '{body.action}'")
    if not can_perform(body.action, user.roles):
        raise ProblemError(403, "forbidden", "Your role cannot perform this action")
    need = await session.get(Need, need_id, with_for_update=True)
    if need is None:
        raise not_found("Need")
    before = need.status
    try:
        after = next_status(before, body.action, need.raised_minor, need.target_minor)
    except InvalidTransitionError as exc:
        raise ProblemError(409, "invalid-transition", str(exc), current=before.value) from exc
    now = datetime.now(UTC)
    if body.action == "extend":
        if body.deadline_at is None or body.deadline_at <= now:
            raise ProblemError(422, "deadline-required", "Give a new deadline in the future")
        need.deadline_at = body.deadline_at
    if body.action == "approve":
        need.approved_by_id, need.approved_at = user.id, now
        need.opens_at = need.opens_at or now
    if after == NeedStatus.FUNDED and need.funded_at is None:
        need.funded_at = now
    if after == NeedStatus.DISBURSED:
        need.disbursed_at = now
    if after == NeedStatus.FULFILLED:
        need.fulfilled_at = now
    if body.action == "cancel":
        need.cancel_reason = body.note
    need.status = after
    need.version += 1
    session.add(
        NeedStatusHistory(
            need_id=need.id,
            from_status=before,
            to_status=after,
            action=body.action,
            actor_id=user.id,
            note=body.note,
        )
    )
    session.add(
        AuditLog(
            actor_id=user.id,
            action=f"need.{body.action}",
            entity="need",
            entity_id=need.id,
            before={"status": before.value},
            after={"status": after.value},
        )
    )
    await session.commit()
    return need
