"""
Export API routes for session history and analytics reports.

Requirements: NEW-4.1, NEW-4.2, NEW-4.6, NEW-4.7, NEW-4.8
"""
import logging
import csv
import io
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.interview_session import InterviewSession, SessionStatus
from app.models.session_question import SessionQuestion
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.services.analytics_service import AnalyticsService
from app.services.cache_service import CacheService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/sessions",
    summary="Export Session History to CSV",
    description="Export interview session history for the last 12 months in CSV format"
)
async def export_sessions_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export session history to CSV format.
    
    Requirements: NEW-4.1, NEW-4.4, NEW-4.6, NEW-4.8
    
    Returns:
    - CSV file with columns: session date, role, score, evaluation summary
    - Limited to last 12 months of data
    - Handles special characters in CSV
    
    Response:
    - Content-Type: text/csv
    - Content-Disposition: attachment; filename="interview_sessions_{date}.csv"
    """
    try:
        user_id = current_user.id
        
        logger.info(f"Exporting session history for user {user_id}")
        
        # Calculate date 12 months ago (Req NEW-4.8)
        twelve_months_ago = datetime.utcnow() - timedelta(days=365)
        
        # Query sessions from last 12 months
        sessions = db.query(InterviewSession).filter(
            InterviewSession.user_id == user_id,
            InterviewSession.created_at >= twelve_months_ago,
            InterviewSession.status == SessionStatus.COMPLETED
        ).order_by(InterviewSession.created_at.desc()).all()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)  # Handle special characters
        
        # Write header (Req NEW-4.6)
        writer.writerow([
            'Session Date',
            'Role',
            'Score',
            'Evaluation Summary'
        ])
        
        # Write data rows
        for session in sessions:
            # Get average score from evaluations
            evaluations = db.query(Evaluation).join(Answer).filter(
                Answer.session_id == session.id
            ).all()
            
            if evaluations:
                avg_score = sum(e.overall_score for e in evaluations) / len(evaluations)
                
                # Create evaluation summary
                summary_parts = []
                for eval in evaluations:
                    if eval.strengths:
                        summary_parts.append(f"Strengths: {', '.join(eval.strengths[:2])}")
                    if eval.weaknesses:
                        summary_parts.append(f"Weaknesses: {', '.join(eval.weaknesses[:2])}")
                
                evaluation_summary = '; '.join(summary_parts) if summary_parts else 'No evaluation details'
            else:
                avg_score = 0
                evaluation_summary = 'Not evaluated'
            
            # Format date consistently (Req NEW-4.6)
            session_date = session.created_at.strftime('%Y-%m-%d %H:%M:%S')
            
            writer.writerow([
                session_date,
                session.role,
                f"{avg_score:.1f}",
                evaluation_summary
            ])
        
        # Prepare response
        output.seek(0)
        filename = f"interview_sessions_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        
        logger.info(f"Successfully exported {len(sessions)} sessions for user {user_id}")
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        logger.error(f"Error exporting sessions for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export session history"
        )


@router.get(
    "/analytics",
    summary="Export Analytics Report to PDF",
    description="Export comprehensive analytics report in PDF format"
)
async def export_analytics_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export analytics report to PDF format.
    
    Requirements: NEW-4.2, NEW-4.3, NEW-4.7
    
    Returns:
    - PDF file with charts, statistics, and recommendations
    - Professional formatting
    - Limited to last 12 months of data
    
    Response:
    - Content-Type: application/pdf
    - Content-Disposition: attachment; filename="analytics_report_{date}.pdf"
    """
    try:
        user_id = current_user.id
        
        logger.info(f"Exporting analytics report for user {user_id}")
        
        # Get analytics data
        cache_service = CacheService()
        analytics_service = AnalyticsService(db, cache_service)
        
        # Fetch comprehensive analytics
        overview_raw = analytics_service.get_analytics_overview(user_id)
        # Convert to dict if it's a Pydantic model or other object
        if hasattr(overview_raw, 'model_dump'):
            overview = overview_raw.model_dump()
        elif hasattr(overview_raw, 'dict'):
            overview = overview_raw.dict()
        elif hasattr(overview_raw, '__dict__'):
            overview = vars(overview_raw)
        elif isinstance(overview_raw, dict):
            overview = overview_raw
        else:
            overview = dict(overview_raw)
        
        # Import PDF generation library
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
            from reportlab.lib import colors
            from reportlab.lib.enums import TA_CENTER, TA_LEFT
        except ImportError:
            logger.error("reportlab not installed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PDF generation library not available. Please install reportlab."
            )
        
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        # Title
        story.append(Paragraph("Interview Performance Analytics Report", title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # User info
        story.append(Paragraph(f"<b>User:</b> {current_user.name}", styles['Normal']))
        story.append(Paragraph(f"<b>Email:</b> {current_user.email}", styles['Normal']))
        story.append(Paragraph(f"<b>Report Date:</b> {datetime.utcnow().strftime('%Y-%m-%d')}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Overview Statistics
        story.append(Paragraph("Performance Overview", heading_style))
        
        total_sessions = overview.get('total_interviews_completed', 0)
        avg_score = overview.get('average_score_all_time') or 0
        practice_hours = overview.get('total_practice_hours', 0)
        improvement = overview.get('improvement_rate') or 0
        
        overview_data = [
            ['Metric', 'Value'],
            ['Total Sessions', str(total_sessions)],
            ['Average Score', f"{avg_score:.1f}%"],
            ['Total Practice Time', f"{practice_hours:.1f} hours"],
            ['Improvement Rate', f"{improvement:.1f}%"]
        ]
        
        overview_table = Table(overview_data, colWidths=[3*inch, 2*inch])
        overview_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(overview_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Strengths and Weaknesses
        story.append(Paragraph("Strengths &amp; Areas for Improvement", heading_style))
        
        top_strengths = overview.get('top_5_strengths', [])
        if top_strengths:
            story.append(Paragraph("<b>Top Strengths:</b>", styles['Normal']))
            for strength in top_strengths[:5]:
                story.append(Paragraph(f"• {strength}", styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
        
        top_weaknesses = overview.get('top_5_weaknesses', [])
        if top_weaknesses:
            story.append(Paragraph("<b>Areas for Improvement:</b>", styles['Normal']))
            for weakness in top_weaknesses[:5]:
                story.append(Paragraph(f"• {weakness}", styles['Normal']))
            story.append(Spacer(1, 0.3*inch))
        
        # Recommendations
        recommendations = overview.get('practice_recommendations', [])
        if recommendations:
            story.append(Paragraph("Personalized Recommendations", heading_style))
            for i, rec in enumerate(recommendations[:5], 1):
                if isinstance(rec, dict):
                    story.append(Paragraph(f"{i}. {rec.get('suggestion', str(rec))}", styles['Normal']))
                else:
                    story.append(Paragraph(f"{i}. {rec}", styles['Normal']))
            story.append(Spacer(1, 0.3*inch))
        
        # Recent Sessions
        story.append(Paragraph("Recent Session Performance", heading_style))
        
        recent_sessions = overview.get('score_over_time', [])
        if recent_sessions:
            session_data = [['Week', 'Avg Score', 'Sessions']]
            for session in recent_sessions[:10]:
                if isinstance(session, dict):
                    session_data.append([
                        session.get('week', 'N/A'),
                        f"{session.get('avg_score', 0):.1f}",
                        str(session.get('session_count', 0)),
                    ])
            
            session_table = Table(session_data, colWidths=[1.5*inch, 2*inch, 1*inch, 1.5*inch])
            session_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(session_table)
        
        # Build PDF
        doc.build(story)
        
        # Prepare response
        buffer.seek(0)
        filename = f"analytics_report_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
        
        logger.info(f"Successfully exported analytics report for user {user_id}")
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting analytics for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export analytics report: {str(e)}"
        )

