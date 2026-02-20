"""create company_coaching_sessions table

Revision ID: 014
Revises: 013
Create Date: 2026-02-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create company_coaching_sessions table
    op.create_table(
        'company_coaching_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(length=200), nullable=False),
        sa.Column('target_role', sa.String(length=200), nullable=True),
        sa.Column('coaching_data', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('agent_reasoning', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('execution_time_ms', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_company_coaching_user_created', 'company_coaching_sessions', ['user_id', 'created_at'])
    op.create_index('idx_company_coaching_company', 'company_coaching_sessions', ['company_name'])
    op.create_index(op.f('ix_company_coaching_sessions_id'), 'company_coaching_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_company_coaching_sessions_company_name'), 'company_coaching_sessions', ['company_name'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_company_coaching_sessions_company_name'), table_name='company_coaching_sessions')
    op.drop_index(op.f('ix_company_coaching_sessions_id'), table_name='company_coaching_sessions')
    op.drop_index('idx_company_coaching_company', table_name='company_coaching_sessions')
    op.drop_index('idx_company_coaching_user_created', table_name='company_coaching_sessions')
    
    # Drop table
    op.drop_table('company_coaching_sessions')
