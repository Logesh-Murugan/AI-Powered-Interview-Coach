"""create questions table

Revision ID: 006
Revises: 005
Create Date: 2026-02-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('difficulty', sa.String(length=20), nullable=False),
        sa.Column('role', sa.String(length=100), nullable=False),
        sa.Column('expected_answer_points', JSONB, nullable=False),
        sa.Column('time_limit_seconds', sa.Integer(), nullable=False),
        sa.Column('provider_name', sa.String(length=50), nullable=True),
        sa.Column('generation_metadata', JSONB, nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for efficient querying
    op.create_index('idx_questions_role_difficulty', 'questions', ['role', 'difficulty'])
    op.create_index('idx_questions_category', 'questions', ['category'])
    op.create_index('idx_questions_role_difficulty_category', 'questions', ['role', 'difficulty', 'category'])


def downgrade():
    op.drop_index('idx_questions_role_difficulty_category', table_name='questions')
    op.drop_index('idx_questions_category', table_name='questions')
    op.drop_index('idx_questions_role_difficulty', table_name='questions')
    op.drop_table('questions')
