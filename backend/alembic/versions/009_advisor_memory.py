"""add persistent business advisor memory

Revision ID: 009
Revises: 008
"""

from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "advisor_messages",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_advisor_messages_user_id", "advisor_messages", ["user_id"], unique=False)
    op.create_index("ix_advisor_messages_created_at", "advisor_messages", ["created_at"], unique=False)

def downgrade() -> None:
    op.drop_index("ix_advisor_messages_created_at", table_name="advisor_messages")
    op.drop_index("ix_advisor_messages_user_id", table_name="advisor_messages")
    op.drop_table("advisor_messages")
