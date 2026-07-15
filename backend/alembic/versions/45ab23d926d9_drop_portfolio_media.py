"""drop portfolio_media

Revision ID: 45ab23d926d9
Revises: 7ded3d2b5202
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '45ab23d926d9'
down_revision: Union[str, Sequence[str], None] = '7ded3d2b5202'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table('portfolio_media')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table('portfolio_media',
    sa.Column('portfolio_post_id', sa.UUID(), nullable=False),
    sa.Column('media_type', sa.String(length=20), nullable=False),
    sa.Column('file_path', sa.String(length=500), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['portfolio_post_id'], ['portfolio_posts.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
