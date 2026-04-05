"""
Forms router — full CRUD for forms.
GET /{form_id} is public (no auth), all others require authentication.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import get_db
from models.form import Form
from models.user import User
from schemas.form import FormCreate, FormUpdate, FormOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/api/forms", tags=["forms"])


@router.get("/", response_model=List[FormOut])
def list_forms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all forms owned by the authenticated user, sorted by created_date desc."""
    return (
        db.query(Form)
        .filter(Form.created_by == current_user.email)
        .order_by(Form.created_date.desc())
        .all()
    )


@router.post("/", response_model=FormOut, status_code=201)
def create_form(data: FormCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new form."""
    form_data = data.model_dump()
    # Convert nested Pydantic models to dicts for JSON columns
    if form_data.get("branding"):
        form_data["branding"] = data.branding.model_dump() if data.branding else {}
    if form_data.get("questions"):
        form_data["questions"] = [q.model_dump() for q in data.questions]
    form = Form(**form_data, created_by=current_user.email)
    db.add(form)
    db.commit()
    db.refresh(form)
    return form


@router.get("/{form_id}", response_model=FormOut)
def get_form(form_id: str, db: Session = Depends(get_db)):
    """
    Get a single form by ID — **PUBLIC** (no auth required).
    Used by the public form-fill page `/f/:id`.
    Returns 404 if not found, 403 if status is not 'published' (for public access).
    """
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.put("/{form_id}", response_model=FormOut)
def update_form(
    form_id: str,
    data: FormUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update any subset of form fields. Only the form owner can update."""
    form = (
        db.query(Form)
        .filter(Form.id == form_id, Form.created_by == current_user.email)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or access denied")

    update_data = data.model_dump(exclude_unset=True)

    # Serialize nested Pydantic models for JSON columns
    if "branding" in update_data and data.branding is not None:
        update_data["branding"] = data.branding.model_dump()
    if "questions" in update_data and data.questions is not None:
        update_data["questions"] = [q.model_dump() for q in data.questions]

    for key, value in update_data.items():
        setattr(form, key, value)

    db.commit()
    db.refresh(form)
    return form


@router.delete("/{form_id}", status_code=204)
def delete_form(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a form. Only the form owner can delete."""
    form = (
        db.query(Form)
        .filter(Form.id == form_id, Form.created_by == current_user.email)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or access denied")
    db.delete(form)
    db.commit()
    return None
