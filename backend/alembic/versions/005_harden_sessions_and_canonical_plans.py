"""add refresh sessions and canonicalize subscription plans
Revision ID: 005
Revises: 004
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "refresh_sessions",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("jti", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("jti", name="uq_refresh_sessions_jti"),
    )
    op.create_index("ix_refresh_sessions_user_id", "refresh_sessions", ["user_id"])
    op.create_index("ix_refresh_sessions_jti", "refresh_sessions", ["jti"], unique=True)
    op.create_index("ix_refresh_sessions_expires_at", "refresh_sessions", ["expires_at"])
    op.create_index("ix_refresh_sessions_revoked_at", "refresh_sessions", ["revoked_at"])
    op.execute("UPDATE subscriptions SET plan = 'free' WHERE plan IN ('starter', 'free')")
    op.execute("UPDATE subscriptions SET plan = 'business' WHERE plan IN ('pro', 'business')")
    op.execute("UPDATE subscriptions SET plan = 'enterprise' WHERE plan IN ('premium', 'enterprise')")

def downgrade() -> None:
    op.drop_table("refresh_sessions")
