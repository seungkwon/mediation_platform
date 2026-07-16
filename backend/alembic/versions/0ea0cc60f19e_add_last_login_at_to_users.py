"""add last_login_at to users

Revision ID: 0ea0cc60f19e
Revises: 516b879eed91
Create Date: 2026-07-16 16:48:21.157669

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0ea0cc60f19e'
down_revision: Union[str, Sequence[str], None] = '516b879eed91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'last_login_at')
