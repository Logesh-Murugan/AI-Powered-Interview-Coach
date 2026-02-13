"""create ai_provider_usage table

Revision ID: 005
Revises: 004
Create Date: 2026-02-12

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    """
    Create ai_provider_usage table for quota tracking.
    
    Requirements: 26.1, 26.2, 26.3
    """
    # Create ai_provider_usage table
    op.create_table(
        'ai_provider_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        
        # Provider identification
        sa.Column('provider_name', sa.String(length=100), nullable=False),
        
        # Date tracking
        sa.Column('date', sa.Date(), nullable=False),
        
        # Usage metrics
        sa.Column('request_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('character_count', sa.Integer(), nullable=False, server_default='0'),
        
        # Primary key
        sa.PrimaryKeyConstraint('id'),
        
        # Unique constraint: one record per provider per day
        sa.UniqueConstraint('provider_name', 'date', name='uix_provider_date'),
    )
    
    # Create indexes
    op.create_index('ix_ai_provider_usage_id', 'ai_provider_usage', ['id'])
    op.create_index('ix_ai_provider_usage_provider_name', 'ai_provider_usage', ['provider_name'])
    op.create_index('ix_ai_provider_usage_date', 'ai_provider_usage', ['date'])


def downgrade():
    """
    Drop ai_provider_usage table and related indexes.
    """
    # Drop indexes
    op.drop_index('ix_ai_provider_usage_date', table_name='ai_provider_usage')
    op.drop_index('ix_ai_provider_usage_provider_name', table_name='ai_provider_usage')
    op.drop_index('ix_ai_provider_usage_id', table_name='ai_provider_usage')
    
    # Drop table
    op.drop_table('ai_provider_usage')
