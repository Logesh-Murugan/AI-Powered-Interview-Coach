"""Create users table

Revision ID: 001
Revises: 
Create Date: 2026-02-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create users table with all required fields"""
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('target_role', sa.String(length=255), nullable=True),
        sa.Column('experience_level', sa.Enum(
            'ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL',
            name='experiencelevel'
        ), nullable=True),
        sa.Column('account_status', sa.Enum(
            'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'LOCKED',
            name='accountstatus'
        ), nullable=False),
        sa.Column('failed_login_attempts', sa.String(length=10), nullable=False),
        sa.Column('last_login_at', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_target_role'), 'users', ['target_role'], unique=False)


def downgrade() -> None:
    """Drop users table"""
    op.drop_index(op.f('ix_users_target_role'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
    
    # Drop enums (PostgreSQL specific)
    op.execute('DROP TYPE IF EXISTS accountstatus')
    op.execute('DROP TYPE IF EXISTS experiencelevel')
