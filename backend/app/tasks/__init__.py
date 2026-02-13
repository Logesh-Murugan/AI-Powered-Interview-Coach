"""Background tasks package"""

from app.tasks.resume_tasks import extract_resume_text_task, process_resume_pipeline

__all__ = ['extract_resume_text_task', 'process_resume_pipeline']
