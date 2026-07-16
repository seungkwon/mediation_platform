"""add active_role to users

Revision ID: 516b879eed91
Revises: fba0383b9eb3
Create Date: 2026-07-16 16:11:34.295301

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '516b879eed91'
down_revision: Union[str, Sequence[str], None] = 'fba0383b9eb3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('active_role', sa.String(length=20), server_default='buyer', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'active_role')
