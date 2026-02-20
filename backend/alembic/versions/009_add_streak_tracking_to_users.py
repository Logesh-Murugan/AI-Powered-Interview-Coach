"""add streak tracking to users

Revision ID: 009
Revises: 008
Create Date: 2026-02-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    # Add streak tracking columns to users table
    op.add_column('users', sa.Column('last_practice_date', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('longest_streak', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('streak_history', JSONB, nullable=False, server_default='[]'))
    
    # Create index on last_practice_date for efficient queries
    op.create_index('ix_users_last_practice_date', 'users', ['last_practice_date'])


def downgrade():
    # Drop index
    op.drop_index('ix_users_last_practice_date', 'users')
    
    # Drop columns
    op.drop_column('users', 'streak_history')
    op.drop_column('users', 'longest_streak')
    op.drop_column('users', 'current_streak')
    op.drop_column('users', 'last_practice_date')
