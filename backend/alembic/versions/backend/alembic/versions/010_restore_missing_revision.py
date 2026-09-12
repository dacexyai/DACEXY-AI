"""Restore missing Alembic revision 010.

This revision intentionally makes no schema changes.
It restores the migration chain expected by the existing
production database.
"""

from typing import Sequence, Union


revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
