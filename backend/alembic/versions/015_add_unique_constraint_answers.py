"""add unique constraint to answers

Revision ID: 015
Revises: 014
Create Date: 2026-02-25 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade():
    """Add unique constraint to prevent duplicate answers for same session+question"""
    # Create unique constraint on (session_id, question_id)
    # This prevents a user from submitting multiple answers to the same question in a session
    op.create_unique_constraint(
        'uq_answers_session_question',
        'answers',
        ['session_id', 'question_id']
    )


def downgrade():
    """Remove unique constraint"""
    op.drop_constraint('uq_answers_session_question', 'answers', type_='unique')
