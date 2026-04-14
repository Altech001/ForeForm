import uuid
import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from db import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="todo") # todo, in_progress, done
    priority = Column(String, default="medium") # high, medium, low
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    assignee_email = Column(String, nullable=True)
    attachment_url = Column(String, nullable=True)
    
    # Define relationship with User if you like, but assignee_email is enough based on UI
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    user = relationship("User")
    
    activities = relationship("TaskActivity", back_populates="task", cascade="all, delete-orphan", order_by="TaskActivity.created_at.desc()")

class TaskActivity(Base):
    __tablename__ = "task_activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    action = Column(String, nullable=False)
    user = Column(String, nullable=False) # e.g. "You" or email depending on ui
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    task = relationship("Task", back_populates="activities")
