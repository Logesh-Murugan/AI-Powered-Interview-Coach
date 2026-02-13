"""create interview session tables

Revision ID: 007
Revises: 006
Create Date: 2026-02-12

Creates tables for interview sessions, session questions, answers, answer drafts,
evaluations, and session summaries.

Requirements: 14.1-14.10, 15.1-15.7, 16.1-16.10, 17.1-17.7, 18.1-18.14, 19.1-19.12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # Create interview_sessions table
    op.create_table(
        'interview_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=100), nullable=False),
        sa.Column('difficulty', sa.String(length=20), nullable=False),
        sa.Column('status', sa.Enum('IN_PROGRESS', 'COMPLETED', 'ABANDONED', name='sessionstatus'), nullable=False),
        sa.Column('question_count', sa.Integer(), nullable=False),
        sa.Column('categories', JSON, nullable=True),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('session_metadata', JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_interview_sessions_id', 'interview_sessions', ['id'])
    op.create_index('ix_interview_sessions_user_id', 'interview_sessions', ['user_id'])
    op.create_index('ix_interview_sessions_role', 'interview_sessions', ['role'])
    op.create_index('ix_interview_sessions_status', 'interview_sessions', ['status'])
    
    # Create answers table (must be created before session_questions due to FK)
    op.create_table(
        'answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('answer_text', sa.Text(), nullable=False),
        sa.Column('time_taken', sa.Integer(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_answers_id', 'answers', ['id'])
    op.create_index('ix_answers_session_id', 'answers', ['session_id'])
    op.create_index('ix_answers_question_id', 'answers', ['question_id'])
    op.create_index('ix_answers_user_id', 'answers', ['user_id'])
    
    # Create session_questions table
    op.create_table(
        'session_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False),
        sa.Column('question_displayed_at', sa.DateTime(), nullable=True),
        sa.Column('answer_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['answer_id'], ['answers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_session_questions_id', 'session_questions', ['id'])
    op.create_index('ix_session_questions_session_id', 'session_questions', ['session_id'])
    op.create_index('ix_session_questions_question_id', 'session_questions', ['question_id'])
    
    # Create answer_drafts table
    op.create_table(
        'answer_drafts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('draft_text', sa.Text(), nullable=False),
        sa.Column('last_saved_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_answer_drafts_id', 'answer_drafts', ['id'])
    op.create_index('ix_answer_drafts_session_id', 'answer_drafts', ['session_id'])
    op.create_index('ix_answer_drafts_question_id', 'answer_drafts', ['question_id'])
    op.create_index('ix_answer_drafts_user_id', 'answer_drafts', ['user_id'])
    
    # Create evaluations table
    op.create_table(
        'evaluations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('answer_id', sa.Integer(), nullable=False),
        sa.Column('content_quality', sa.Float(), nullable=False),
        sa.Column('clarity', sa.Float(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('technical_accuracy', sa.Float(), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('strengths', JSON, nullable=False),
        sa.Column('improvements', JSON, nullable=False),
        sa.Column('suggestions', JSON, nullable=False),
        sa.Column('example_answer', sa.Text(), nullable=True),
        sa.Column('provider_name', sa.String(length=50), nullable=True),
        sa.Column('evaluation_metadata', JSON, nullable=True),
        sa.Column('evaluated_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['answer_id'], ['answers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('answer_id')
    )
    op.create_index('ix_evaluations_id', 'evaluations', ['id'])
    op.create_index('ix_evaluations_answer_id', 'evaluations', ['answer_id'], unique=True)
    
    # Add FK from answers to evaluations (circular reference handled with post_update)
    # This is already defined in the model with post_update=True
    
    # Create session_summaries table
    op.create_table(
        'session_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('overall_session_score', sa.Float(), nullable=False),
        sa.Column('avg_content_quality', sa.Float(), nullable=False),
        sa.Column('avg_clarity', sa.Float(), nullable=False),
        sa.Column('avg_confidence', sa.Float(), nullable=False),
        sa.Column('avg_technical_accuracy', sa.Float(), nullable=False),
        sa.Column('score_trend', sa.Float(), nullable=True),
        sa.Column('previous_session_score', sa.Float(), nullable=True),
        sa.Column('top_strengths', JSON, nullable=False),
        sa.Column('top_improvements', JSON, nullable=False),
        sa.Column('category_performance', JSON, nullable=False),
        sa.Column('radar_chart_data', JSON, nullable=True),
        sa.Column('line_chart_data', JSON, nullable=True),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('total_time_seconds', sa.Integer(), nullable=False),
        sa.Column('generated_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id')
    )
    op.create_index('ix_session_summaries_id', 'session_summaries', ['id'])
    op.create_index('ix_session_summaries_session_id', 'session_summaries', ['session_id'], unique=True)


def downgrade():
    # Drop tables in reverse order
    op.drop_index('ix_session_summaries_session_id', table_name='session_summaries')
    op.drop_index('ix_session_summaries_id', table_name='session_summaries')
    op.drop_table('session_summaries')
    
    op.drop_index('ix_evaluations_answer_id', table_name='evaluations')
    op.drop_index('ix_evaluations_id', table_name='evaluations')
    op.drop_table('evaluations')
    
    op.drop_index('ix_answer_drafts_user_id', table_name='answer_drafts')
    op.drop_index('ix_answer_drafts_question_id', table_name='answer_drafts')
    op.drop_index('ix_answer_drafts_session_id', table_name='answer_drafts')
    op.drop_index('ix_answer_drafts_id', table_name='answer_drafts')
    op.drop_table('answer_drafts')
    
    op.drop_index('ix_session_questions_question_id', table_name='session_questions')
    op.drop_index('ix_session_questions_session_id', table_name='session_questions')
    op.drop_index('ix_session_questions_id', table_name='session_questions')
    op.drop_table('session_questions')
    
    op.drop_index('ix_answers_user_id', table_name='answers')
    op.drop_index('ix_answers_question_id', table_name='answers')
    op.drop_index('ix_answers_session_id', table_name='answers')
    op.drop_index('ix_answers_id', table_name='answers')
    op.drop_table('answers')
    
    op.drop_index('ix_interview_sessions_status', table_name='interview_sessions')
    op.drop_index('ix_interview_sessions_role', table_name='interview_sessions')
    op.drop_index('ix_interview_sessions_user_id', table_name='interview_sessions')
    op.drop_index('ix_interview_sessions_id', table_name='interview_sessions')
    op.drop_table('interview_sessions')
    
    # Drop enum type
    op.execute('DROP TYPE sessionstatus')
