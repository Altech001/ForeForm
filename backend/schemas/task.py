from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class TaskActivityBase(BaseModel):
    action: str
    user: str

class TaskActivityCreate(TaskActivityBase):
    pass

class TaskActivityOut(TaskActivityBase):
    id: str
    created_at: datetime
    task_id: str

    model_config = ConfigDict(from_attributes=True)

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None
    assignee_email: Optional[str] = None
    attachment_url: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    assignee_email: Optional[str] = None
    attachment_url: Optional[str] = None

class TaskOut(TaskBase):
    id: str
    user_id: str
    created_at: datetime
    activities: List[TaskActivityOut] = []

    model_config = ConfigDict(from_attributes=True)
