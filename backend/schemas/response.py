
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ── Nested objects ───────────────────────────────────────────

class AnswerItem(BaseModel):
    question_id: str
    question_label: Optional[str] = None
    question_type: Optional[str] = None
    answer: Optional[str] = None


# ── Create ───────────────────────────────────────────────────

class ResponseCreate(BaseModel):
    respondent_name: Optional[str] = None
    respondent_email: Optional[str] = None
    signature_data_url: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    gps_accuracy: Optional[float] = None
    gps_address: Optional[str] = None
    answers: List[AnswerItem] = []


# ── Read / Response ──────────────────────────────────────────

class ResponseOut(BaseModel):
    id: str
    form_id: str
    respondent_name: Optional[str] = None
    respondent_email: Optional[str] = None
    signature_data_url: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    gps_accuracy: Optional[float] = None
    gps_address: Optional[str] = None
    answers: Any  # JSON
    created_date: datetime
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True
