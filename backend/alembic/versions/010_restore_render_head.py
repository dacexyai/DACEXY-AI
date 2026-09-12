"""Restore the production Alembic revision 010.

This is intentionally a no-op revision. The production database can reference
010 while the source tree may otherwise end at 009.
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
