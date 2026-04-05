"""
Responses router — submit and manage form responses.
POST /{form_id}/responses is public; GET and DELETE require auth.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from models.form import Form
from models.form_response import FormResponse
from models.user import User
from schemas.response import ResponseCreate, ResponseOut
from auth.jwt import get_current_user

router = APIRouter(prefix="/api", tags=["responses"])


# ── List all responses for a form (authenticated) ───────────

@router.get("/forms/{form_id}/responses", response_model=List[ResponseOut])
def list_responses(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all responses for a form. Only the form owner can view."""
    form = (
        db.query(Form)
        .filter(Form.id == form_id, Form.created_by == current_user.email)
        .first()
    )
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or access denied")
    return (
        db.query(FormResponse)
        .filter(FormResponse.form_id == form_id)
        .order_by(FormResponse.created_date.desc())
        .all()
    )


# ── Submit a response (PUBLIC — no auth) ─────────────────────

@router.post("/forms/{form_id}/responses", response_model=ResponseOut, status_code=201)
def submit_response(form_id: str, data: ResponseCreate, db: Session = Depends(get_db)):
    """
    Submit a form response — **PUBLIC** (no auth required).
    Side effects: increments Form.response_count by 1.
    """
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form or form.status != "published":
        raise HTTPException(status_code=403, detail="Form not accepting responses")

    response_data = data.model_dump()
    # Serialize answers list[AnswerItem] → list[dict] for JSON column
    if response_data.get("answers"):
        response_data["answers"] = [a.model_dump() for a in data.answers]

    response = FormResponse(form_id=form_id, **response_data)
    db.add(response)

    # Increment response count
    form.response_count = (form.response_count or 0) + 1

    db.commit()
    db.refresh(response)
    # TODO: optionally send confirmation email to respondent_email
    return response


# ── Get a single response (authenticated) ────────────────────

@router.get("/responses/{response_id}", response_model=ResponseOut)
def get_response(
    response_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single response. Only the form owner can view."""
    response = db.query(FormResponse).filter(FormResponse.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    # Verify the current user owns the parent form
    form = db.query(Form).filter(Form.id == response.form_id, Form.created_by == current_user.email).first()
    if not form:
        raise HTTPException(status_code=403, detail="Access denied")
    return response


# ── Delete a response (authenticated) ────────────────────────

@router.delete("/responses/{response_id}", status_code=204)
def delete_response(
    response_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a response. Only the form owner can delete."""
    response = db.query(FormResponse).filter(FormResponse.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    form = db.query(Form).filter(Form.id == response.form_id, Form.created_by == current_user.email).first()
    if not form:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(response)
    form.response_count = max((form.response_count or 1) - 1, 0)
    db.commit()
    return None
