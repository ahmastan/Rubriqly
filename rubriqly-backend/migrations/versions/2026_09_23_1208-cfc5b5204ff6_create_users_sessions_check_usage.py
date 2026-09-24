"""create users, sessions, check_usage

Revision ID: cfc5b5204ff6
Revises:
Create Date: 2026-09-23 12:08:41.141259
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

import rubriqly.db

# revision identifiers, used by Alembic.
revision: str = "cfc5b5204ff6"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=40), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=60), nullable=False),
        sa.Column("email_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", rubriqly.db.UTCDateTime(), nullable=False),
        sa.Column("last_login_at", rubriqly.db.UTCDateTime(), nullable=True),
        sa.Column("signup_ip_hash", sa.String(length=64), nullable=True),
        sa.CheckConstraint("email = lower(email)", name=op.f("ck_users_email_lowercase")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
    )
    op.create_index(op.f("ix_users_created_at"), "users", ["created_at"])
    op.create_index(op.f("ix_users_signup_ip_hash"), "users", ["signup_ip_hash"])

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(length=40), nullable=False),
        sa.Column("user_id", sa.String(length=40), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", rubriqly.db.UTCDateTime(), nullable=False),
        sa.Column("expires_at", rubriqly.db.UTCDateTime(), nullable=False),
        sa.Column("last_seen_at", rubriqly.db.UTCDateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_sessions_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sessions")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_sessions_token_hash")),
    )
    op.create_index(op.f("ix_sessions_user_id"), "sessions", ["user_id"])
    op.create_index(op.f("ix_sessions_expires_at"), "sessions", ["expires_at"])

    op.create_table(
        "check_usage",
        sa.Column("id", sa.String(length=40), nullable=False),
        sa.Column("user_id", sa.String(length=40), nullable=False),
        sa.Column("created_at", rubriqly.db.UTCDateTime(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("input_tokens", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "cost_usd", sa.Numeric(precision=12, scale=8), server_default="0", nullable=False
        ),
        sa.CheckConstraint(
            "status IN ('ok', 'failed', 'rate_limited')", name=op.f("ck_check_usage_status_valid")
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_check_usage_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_check_usage")),
    )
    op.create_index(op.f("ix_check_usage_created_at"), "check_usage", ["created_at"])
    op.create_index("ix_check_usage_user_id_created_at", "check_usage", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_table("check_usage")
    op.drop_table("sessions")
    op.drop_table("users")
