"""create resume_analyses table

Revision ID: 012
Revises: 011
Create Date: 2026-02-15

Requirements: 27.9
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade():
    """Create resume_analyses table"""
    op.create_table(
        'resume_analyses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('resume_id', sa.Integer(), nullable=False),
        sa.Column('analysis_data', JSONB, nullable=False),
        sa.Column('agent_reasoning', JSONB, nullable=True),
        sa.Column('execution_time_ms', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='CASCADE')
    )
    
    # Create indexes for performance
    op.create_index('ix_resume_analyses_user_id', 'resume_analyses', ['user_id'])
    op.create_index('ix_resume_analyses_resume_id', 'resume_analyses', ['resume_id'])
    op.create_index('ix_resume_analyses_status', 'resume_analyses', ['status'])
    op.create_index('ix_resume_analyses_created_at', 'resume_analyses', ['created_at'])


def downgrade():
    """Drop resume_analyses table"""
    op.drop_index('ix_resume_analyses_created_at', table_name='resume_analyses')
    op.drop_index('ix_resume_analyses_status', table_name='resume_analyses')
    op.drop_index('ix_resume_analyses_resume_id', table_name='resume_analyses')
    op.drop_index('ix_resume_analyses_user_id', table_name='resume_analyses')
    op.drop_table('resume_analyses')
