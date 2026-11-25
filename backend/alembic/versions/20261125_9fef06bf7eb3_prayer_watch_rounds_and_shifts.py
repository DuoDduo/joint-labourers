"""prayer watch rounds and shifts

Rebuilds the prayer-watch tables on the campaign sign-up model:
watch -> rounds -> shifts (slots) -> sign-ups. The old watch tables were never used
or deployed, so they are dropped and recreated rather than altered.

Revision ID: 9fef06bf7eb3
Revises: 2a24cbdce557
Create Date: 2026-11-25 14:19:50.086867
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "9fef06bf7eb3"
down_revision: str | None = "2a24cbdce557"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

NOW = sa.text("(CURRENT_TIMESTAMP)")


def upgrade() -> None:
    op.drop_table("prayer_watch_signups")
    op.drop_table("prayer_watches")

    op.create_table(
        "prayer_watches",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("banner_image", sa.String(length=300), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("meeting_url", sa.String(length=300), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_prayer_watches")),
        sa.UniqueConstraint("slug", name=op.f("uq_prayer_watches_slug")),
    )
    op.create_table(
        "prayer_watch_rounds",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("watch_id", sa.String(length=32), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["watch_id"], ["prayer_watches.id"],
            name=op.f("fk_prayer_watch_rounds_watch_id_prayer_watches"), ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_prayer_watch_rounds")),
    )
    op.create_index(op.f("ix_prayer_watch_rounds_watch_id"), "prayer_watch_rounds", ["watch_id"])
    op.create_table(
        "prayer_watch_slots",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("round_id", sa.String(length=32), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.CheckConstraint("ends_at > starts_at", name=op.f("ck_prayer_watch_slots_slot_order")),
        sa.ForeignKeyConstraint(
            ["round_id"], ["prayer_watch_rounds.id"],
            name=op.f("fk_prayer_watch_slots_round_id_prayer_watch_rounds"), ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_prayer_watch_slots")),
    )
    op.create_index(op.f("ix_prayer_watch_slots_round_id"), "prayer_watch_slots", ["round_id"])
    op.create_table(
        "prayer_watch_signups",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("watch_id", sa.String(length=32), nullable=False),
        sa.Column("slot_id", sa.String(length=32), nullable=False),
        sa.Column("intercessor_id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False),
        sa.ForeignKeyConstraint(
            ["watch_id"], ["prayer_watches.id"],
            name=op.f("fk_prayer_watch_signups_watch_id_prayer_watches"), ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["slot_id"], ["prayer_watch_slots.id"],
            name=op.f("fk_prayer_watch_signups_slot_id_prayer_watch_slots"), ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["intercessor_id"], ["intercessors.id"],
            name=op.f("fk_prayer_watch_signups_intercessor_id_intercessors"), ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_prayer_watch_signups")),
        sa.UniqueConstraint("slot_id", "intercessor_id", name="uq_watch_signup_slot_person"),
    )
    op.create_index(op.f("ix_prayer_watch_signups_watch_id"), "prayer_watch_signups", ["watch_id"])
    op.create_index(op.f("ix_prayer_watch_signups_slot_id"), "prayer_watch_signups", ["slot_id"])
    op.create_index(
        op.f("ix_prayer_watch_signups_intercessor_id"), "prayer_watch_signups", ["intercessor_id"]
    )


def downgrade() -> None:
    op.drop_table("prayer_watch_signups")
    op.drop_table("prayer_watch_slots")
    op.drop_table("prayer_watch_rounds")
    op.drop_table("prayer_watches")
    op.create_table(
        "prayer_watches",
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("meeting_url", sa.String(length=300), nullable=True),
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_prayer_watches")),
    )
    op.create_table(
        "prayer_watch_signups",
        sa.Column("watch_id", sa.String(length=32), nullable=False),
        sa.Column("intercessor_id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=NOW, nullable=False),
        sa.ForeignKeyConstraint(
            ["intercessor_id"], ["intercessors.id"],
            name=op.f("fk_prayer_watch_signups_intercessor_id_intercessors"), ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["watch_id"], ["prayer_watches.id"],
            name=op.f("fk_prayer_watch_signups_watch_id_prayer_watches"), ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("watch_id", "intercessor_id", name=op.f("pk_prayer_watch_signups")),
    )
