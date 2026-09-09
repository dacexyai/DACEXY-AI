"""harden usage budgets and task metering\nRevision ID: 010\nRevises: 007\n"""
from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("usage_logs", sa.Column("task_id", sa.String(), nullable=True))
    op.add_column("usage_logs", sa.Column("status", sa.String(), nullable=False, server_default="completed"))
    op.create_index("ix_usage_logs_task_id", "usage_logs", ["task_id"])
    # Previous releases stored this field in rupees despite the old misleading
    # comment. Convert historical non-zero entries to paise before the new guard.
    op.execute("UPDATE usage_logs SET cost_rupees = cost_rupees * 100 WHERE cost_rupees != 0")

def downgrade() -> None:
    op.drop_index("ix_usage_logs_task_id", table_name="usage_logs")
    op.drop_column("usage_logs", "status")
    op.drop_column("usage_logs", "task_id")
