"""create resumes table

Revision ID: 004
Revises: 003
Create Date: 2026-02-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    """
    Create resumes table with JSONB fields and GIN index.
    
    Requirements: 6.7, 6.8, 6.9, 6.10
    """
    # Create resumes table
    op.create_table(
        'resumes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        
        # Foreign key
        sa.Column('user_id', sa.Integer(), nullable=False),
        
        # File information
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        
        # Extracted text
        sa.Column('extracted_text', sa.Text(), nullable=True),
        
        # JSONB fields for structured data
        sa.Column('skills', JSONB, nullable=True),
        sa.Column('experience', JSONB, nullable=True),
        sa.Column('education', JSONB, nullable=True),
        
        # Processing status (using String to avoid enum issues)
        sa.Column('status', sa.String(length=50), nullable=False, server_default='uploaded'),
        
        # Metadata
        sa.Column('total_experience_months', sa.Integer(), nullable=True),
        sa.Column('seniority_level', sa.String(length=50), nullable=True),
        
        # Primary key
        sa.PrimaryKeyConstraint('id'),
        
        # Foreign key constraint
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Create indexes
    op.create_index('ix_resumes_id', 'resumes', ['id'])
    op.create_index('ix_resumes_user_id', 'resumes', ['user_id'])
    op.create_index('ix_resumes_status', 'resumes', ['status'])
    
    # Create GIN index on skills JSONB column for fast JSON queries
    # GIN (Generalized Inverted Index) is optimized for JSONB data
    op.execute('CREATE INDEX ix_resumes_skills_gin ON resumes USING GIN (skills)')


def downgrade():
    """
    Drop resumes table and related indexes.
    """
    # Drop GIN index
    op.execute('DROP INDEX IF EXISTS ix_resumes_skills_gin')
    
    # Drop regular indexes
    op.drop_index('ix_resumes_status', table_name='resumes')
    op.drop_index('ix_resumes_user_id', table_name='resumes')
    op.drop_index('ix_resumes_id', table_name='resumes')
    
    # Drop table
    op.drop_table('resumes')
