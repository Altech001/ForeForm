from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db import get_db
from models.task import Task, TaskActivity
from models.user import User
from schemas.task import TaskCreate, TaskUpdate, TaskOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.post("/", response_model=TaskOut)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_task = Task(**task_in.model_dump(), user_id=current_user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/", response_model=List[TaskOut])
def get_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch tasks for the current user."""
    # Assuming user can see their own tasks or tasks assigned to them
    tasks = db.query(Task).filter(
        (Task.user_id == current_user.id) | (Task.assignee_email == current_user.email)
    ).order_by(Task.created_at.desc()).all()
    return tasks

@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskOut)
def update_task(task_id: str, task_in: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    update_data = task_in.model_dump(exclude_unset=True)
    
    # We should add a TaskActivity if status is marked as done
    if "status" in update_data and update_data["status"] == "done" and task.status != "done":
        activity = TaskActivity(
            task_id=task.id,
            action="marked task as done",
            user=current_user.full_name or "User"
        )
        if "attachment_url" in update_data and update_data["attachment_url"]:
            activity.action += " and uploaded a file"
        db.add(activity)

    for field, value in update_data.items():
        setattr(task, field, value)
        
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}
from pydantic import BaseModel

class TaskComment(BaseModel):
    text: str

@router.post("/{task_id}/comments", response_model=TaskOut)
def add_task_comment(task_id: str, comment: TaskComment, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    activity = TaskActivity(
        task_id=task.id,
        action=f"commented: {comment.text}",
        user=current_user.full_name or "User"
    )
    db.add(activity)
    db.commit()
    db.refresh(task)
    return task
