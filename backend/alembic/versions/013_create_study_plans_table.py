"""create study_plans table

Revision ID: 013
Revises: 012
Create Date: 2026-02-15

Requirements: 28.8
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade():
    """Create study_plans table"""
    op.create_table(
        'study_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('target_role', sa.String(100), nullable=False),
        sa.Column('duration_days', sa.Integer(), nullable=False),
        sa.Column('available_hours_per_week', sa.Integer(), nullable=False),
        sa.Column('plan_data', JSONB, nullable=False),
        sa.Column('agent_reasoning', JSONB, nullable=True),
        sa.Column('execution_time_ms', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('progress_percentage', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # Create indexes for performance
    op.create_index('ix_study_plans_user_id', 'study_plans', ['user_id'])
    op.create_index('ix_study_plans_status', 'study_plans', ['status'])
    op.create_index('ix_study_plans_created_at', 'study_plans', ['created_at'])


def downgrade():
    """Drop study_plans table"""
    op.drop_index('ix_study_plans_created_at', table_name='study_plans')
    op.drop_index('ix_study_plans_status', table_name='study_plans')
    op.drop_index('ix_study_plans_user_id', table_name='study_plans')
    op.drop_table('study_plans')
