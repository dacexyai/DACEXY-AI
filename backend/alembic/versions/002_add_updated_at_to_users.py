"""Add updated_at to users table

Revision ID: 002
Revises: 001
Create Date: 2026-08-21 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add updated_at column to users table."""
    op.add_column('users', sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), nullable=True))
    
    # Update existing rows with current timestamp
    op.execute("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")
    
    # Use Alembic batch mode so fresh SQLite test/dev databases and production
    # PostgreSQL databases both receive the intended NOT NULL constraint.
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('updated_at', nullable=False)


def downgrade() -> None:
    """Remove updated_at column from users table."""
    op.drop_column('users', 'updated_at')
