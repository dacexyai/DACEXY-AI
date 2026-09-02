"""add_usage_logs

Revision ID: 003
Revises: 002
Create Date: 2026-08-22 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'usage_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('api_call_type', sa.String(), nullable=False),
        sa.Column('cost_rupees', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_usage_logs_user_id', 'user_id'),
        sa.Index('ix_usage_logs_created_at', 'created_at'),
    )


def downgrade() -> None:
    op.drop_table('usage_logs')
