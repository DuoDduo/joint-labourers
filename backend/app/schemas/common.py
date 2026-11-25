"""Shared schema base: camelCase JSON, money minor units serialised as strings."""

from datetime import UTC, datetime
from typing import Annotated, Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator
from pydantic.alias_generators import to_camel

# BigInt-safe money: sent to clients as a string, accepted as int or numeric string.
Minor = Annotated[int, Field(ge=0), PlainSerializer(lambda v: str(v), return_type=str)]

T = TypeVar("T")


class Schema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    @field_validator("*", mode="after")
    @classmethod
    def _timestamps_are_utc(cls, value: Any) -> Any:
        """All stored times are UTC. Some drivers (SQLite) return them without a zone;
        mark them as UTC so clients never read them as local time."""
        if isinstance(value, datetime) and value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value


class PageMeta(Schema):
    page: int
    page_size: int
    total: int


class Page(Schema, Generic[T]):
    data: list[T]
    meta: PageMeta
