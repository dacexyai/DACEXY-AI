"""store pending recurring subscription plan until activation
Revision ID: 006
Revises: 005
"""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("subscriptions", sa.Column("pending_plan", sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column("subscriptions", "pending_plan")
