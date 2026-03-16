"""add recording fields to answers table

Revision ID: 016
Revises: 015
Create Date: 2026-03-15

Adds recording-related fields to the answers table for video/audio interview recording system.
All fields are nullable for backward compatibility with existing data.

Requirements: Recording System Implementation
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None


def upgrade():
    """Add recording fields to answers table"""
    # Add recording-related columns to answers table
    op.add_column('answers', sa.Column('audio_url', sa.String(length=500), nullable=True))
    op.add_column('answers', sa.Column('video_url', sa.String(length=500), nullable=True))
    op.add_column('answers', sa.Column('recording_duration', sa.Float(), nullable=True))
    op.add_column('answers', sa.Column('recording_format', sa.String(length=20), nullable=True))
    op.add_column('answers', sa.Column('transcription', sa.Text(), nullable=True))
    op.add_column('answers', sa.Column('voice_analysis', JSON, nullable=True))
    
    # Add indexes for efficient queries on recording URLs
    op.create_index('ix_answers_audio_url', 'answers', ['audio_url'])
    op.create_index('ix_answers_video_url', 'answers', ['video_url'])


def downgrade():
    """Remove recording fields from answers table"""
    # Drop indexes first
    op.drop_index('ix_answers_video_url', table_name='answers')
    op.drop_index('ix_answers_audio_url', table_name='answers')
    
    # Drop columns
    op.drop_column('answers', 'voice_analysis')
    op.drop_column('answers', 'transcription')
    op.drop_column('answers', 'recording_format')
    op.drop_column('answers', 'recording_duration')
    op.drop_column('answers', 'video_url')
    op.drop_column('answers', 'audio_url')