"""add interview modes

Revision ID: 019
Revises: 018
Create Date: 2026-05-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM


# revision identifiers, used by Alembic.
revision = '019'
down_revision = '018'
branch_labels = None
depends_on = None

# Define PostgreSQL enums
interview_mode_enum = ENUM('practice', 'mock', name='interview_mode_enum', create_type=False)
recording_mode_enum = ENUM('text_only', 'audio_only', 'video_audio', name='recording_mode_enum', create_type=False)


def upgrade():
    # Step 1: Create PostgreSQL enum types first
    interview_mode_enum.create(op.get_bind(), checkfirst=True)
    recording_mode_enum.create(op.get_bind(), checkfirst=True)

    # Step 2: Add columns to interview_sessions table
    op.add_column('interview_sessions', sa.Column(
        'interview_mode',
        interview_mode_enum,
        nullable=False,
        server_default='practice',
        comment='Interview type: practice (flexible) or mock (formal simulation)'
    ))
    op.add_column('interview_sessions', sa.Column(
        'recording_mode',
        recording_mode_enum,
        nullable=False,
        server_default='text_only',
        comment='Recording requirement: text_only, audio_only, or video_audio'
    ))
    op.add_column('interview_sessions', sa.Column(
        'timer_enabled',
        sa.Boolean(),
        nullable=False,
        server_default='true',
        comment='Whether countdown timer is active (practice can disable)'
    ))
    op.add_column('interview_sessions', sa.Column(
        'mode_settings',
        sa.JSON(),
        nullable=True,
        comment='Mode-specific configuration (e.g., coaching tips enabled, AI interviewer style)'
    ))

    # Step 3: Add column to answers table
    op.add_column('answers', sa.Column(
        'input_method',
        sa.String(20),
        nullable=True,
        comment='How answer was provided: text, voice, video'
    ))

    # Step 4: Add columns to evaluations table
    op.add_column('evaluations', sa.Column(
        'evaluation_mode',
        sa.String(50),
        nullable=True,
        comment='Mode used for evaluation: practice_text, practice_voice, mock_interview'
    ))
    op.add_column('evaluations', sa.Column(
        'voice_feedback',
        sa.JSON(),
        nullable=True,
        comment='Detailed voice analysis feedback (pace, fillers, confidence)'
    ))
    op.add_column('evaluations', sa.Column(
        'video_feedback',
        sa.JSON(),
        nullable=True,
        comment='Detailed video analysis feedback (eye contact, posture, expressions)'
    ))

    # Step 5: Backfill existing rows to ensure no NULLs in NOT NULL columns
    op.execute("""
        UPDATE interview_sessions
        SET interview_mode = 'practice',
            recording_mode = 'text_only',
            timer_enabled = true
        WHERE interview_mode IS NULL;
    """)


def downgrade():
    # Step 1: Drop columns from evaluations (reverse order)
    op.drop_column('evaluations', 'video_feedback')
    op.drop_column('evaluations', 'voice_feedback')
    op.drop_column('evaluations', 'evaluation_mode')

    # Step 2: Drop column from answers
    op.drop_column('answers', 'input_method')

    # Step 3: Drop columns from interview_sessions (reverse order)
    op.drop_column('interview_sessions', 'mode_settings')
    op.drop_column('interview_sessions', 'timer_enabled')
    op.drop_column('interview_sessions', 'recording_mode')
    op.drop_column('interview_sessions', 'interview_mode')

    # Step 4: Drop enum types
    op.execute('DROP TYPE IF EXISTS recording_mode_enum')
    op.execute('DROP TYPE IF EXISTS interview_mode_enum')
