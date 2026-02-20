"""create leaderboard tables

Revision ID: 010
Revises: 009
Create Date: 2026-02-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade():
    # Add leaderboard_opt_out to users table
    op.add_column('users', sa.Column('leaderboard_opt_out', sa.Boolean(), nullable=False, server_default='false'))
    
    # Create leaderboard_entries table
    op.create_table(
        'leaderboard_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('period', sa.String(20), nullable=False),  # 'weekly' or 'all_time'
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('anonymous_username', sa.String(50), nullable=False),
        sa.Column('average_score', sa.Float(), nullable=False),
        sa.Column('total_interviews', sa.Integer(), nullable=False),
        sa.Column('calculated_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance
    op.create_index('idx_leaderboard_period_rank', 'leaderboard_entries', ['period', 'rank'])
    op.create_index('idx_leaderboard_calculated_at', 'leaderboard_entries', ['calculated_at'])
    op.create_index('idx_leaderboard_deleted_at', 'leaderboard_entries', ['deleted_at'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_leaderboard_deleted_at', table_name='leaderboard_entries')
    op.drop_index('idx_leaderboard_calculated_at', table_name='leaderboard_entries')
    op.drop_index('idx_leaderboard_period_rank', table_name='leaderboard_entries')
    
    # Drop table
    op.drop_table('leaderboard_entries')
    
    # Remove column from users
    op.drop_column('users', 'leaderboard_opt_out')
