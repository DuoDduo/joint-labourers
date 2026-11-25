"""Shared schema base: camelCase JSON, money minor units serialised as strings."""

from typing import Annotated, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer
from pydantic.alias_generators import to_camel

# BigInt-safe money: sent to clients as a string, accepted as int or numeric string.
Minor = Annotated[int, Field(ge=0), PlainSerializer(lambda v: str(v), return_type=str)]

T = TypeVar("T")


class Schema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class PageMeta(Schema):
    page: int
    page_size: int
    total: int


class Page(Schema, Generic[T]):
    data: list[T]
    meta: PageMeta
