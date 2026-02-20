"""create user achievements table

Revision ID: 008
Revises: 007
Create Date: 2026-02-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM


# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade():
    # Create user_achievements table (enum type already exists)
    op.create_table(
        'user_achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('achievement_type', sa.Enum('First_Interview', 'Ten_Interviews', 'Fifty_Interviews', 'Perfect_Score', 'Seven_Day_Streak', 'Thirty_Day_Streak', 'Category_Master', name='achievement_type', create_type=False), nullable=False),
        sa.Column('earned_at', sa.DateTime(), nullable=False),
        sa.Column('achievement_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # Create indexes
    op.create_index('ix_user_achievements_user_id', 'user_achievements', ['user_id'])
    op.create_index('ix_user_achievements_achievement_type', 'user_achievements', ['achievement_type'])
    op.create_index('ix_user_achievements_earned_at', 'user_achievements', ['earned_at'])
    
    # Create unique constraint to prevent duplicate achievements
    op.create_index(
        'ix_user_achievements_user_achievement_unique',
        'user_achievements',
        ['user_id', 'achievement_type'],
        unique=True
    )
    
    # Add total_achievements_count to users table if it doesn't exist
    from sqlalchemy import text
    conn = op.get_bind()
    result = conn.execute(
        text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='total_achievements_count'")
    ).fetchone()
    
    if not result:
        op.add_column('users', sa.Column('total_achievements_count', sa.Integer(), nullable=False, server_default='0'))


def downgrade():
    # Remove column from users table
    op.drop_column('users', 'total_achievements_count')
    
    # Drop indexes
    op.drop_index('ix_user_achievements_user_achievement_unique', 'user_achievements')
    op.drop_index('ix_user_achievements_earned_at', 'user_achievements')
    op.drop_index('ix_user_achievements_achievement_type', 'user_achievements')
    op.drop_index('ix_user_achievements_user_id', 'user_achievements')
    
    # Drop table
    op.drop_table('user_achievements')
    
    # Drop enum
    achievement_type_enum = ENUM(name='achievement_type')
    achievement_type_enum.drop(op.get_bind(), checkfirst=True)
