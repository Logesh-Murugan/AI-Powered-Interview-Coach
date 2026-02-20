"""create cache metadata table

Revision ID: 011
Revises: 010
Create Date: 2026-02-15

Requirements: 25.6, 25.7, 25.8
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade():
    """Create cache_metadata table for tracking cache statistics."""
    op.create_table(
        'cache_metadata',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cache_layer', sa.String(50), nullable=False),
        sa.Column('cache_hits', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('cache_misses', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('hit_rate', sa.Float(), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cache_layer', name='uq_cache_layer')
    )
    
    # Create index on cache_layer for fast lookups
    op.create_index('ix_cache_metadata_cache_layer', 'cache_metadata', ['cache_layer'])
    
    # Insert initial records for each cache layer
    op.execute("""
        INSERT INTO cache_metadata (cache_layer, cache_hits, cache_misses, hit_rate)
        VALUES 
            ('L1_Questions', 0, 0, 0.0),
            ('L2_Evaluations', 0, 0, 0.0),
            ('L3_Sessions', 0, 0, 0.0),
            ('L4_User_Preferences', 0, 0, 0.0),
            ('Overall', 0, 0, 0.0)
    """)


def downgrade():
    """Drop cache_metadata table."""
    op.drop_index('ix_cache_metadata_cache_layer', table_name='cache_metadata')
    op.drop_table('cache_metadata')
