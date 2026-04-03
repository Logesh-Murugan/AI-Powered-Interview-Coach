"""add video_analysis field

Revision ID: 017_add_video_analysis
Revises: 016_add_recording_fields
Create Date: 2026-03-25 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '017'
down_revision = '016'
branch_labels = None
depends_on = None


def upgrade():
    # Add video_analysis column to answers table
    op.add_column('answers', sa.Column('video_analysis', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade():
    # Remove video_analysis column from answers table
    op.drop_column('answers', 'video_analysis')
