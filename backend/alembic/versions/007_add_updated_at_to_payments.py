"""add updated_at to payments

Revision ID: 007
Revises: 006
"""
from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    # Backfill existing rows before making the column non-nullable.
    bind = op.get_bind()
    bind.execute(sa.text("UPDATE payments SET updated_at = created_at WHERE updated_at IS NULL"))
    with op.batch_alter_table("payments") as batch_op:
        batch_op.alter_column("updated_at", existing_type=sa.DateTime(), nullable=False)


def downgrade() -> None:
    op.drop_column("payments", "updated_at")
