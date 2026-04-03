"""add is_admin to users

Revision ID: 018
Revises: 017
Create Date: 2026-03-26

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '018'
down_revision = '017'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_admin column to users table for scalable role management
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    # Drop is_admin column
    op.drop_column('users', 'is_admin')
