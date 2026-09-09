"""Restore Alembic migration chain.

Revision ID: 008
Revises: 007
"""

from typing import Sequence, Union

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass
