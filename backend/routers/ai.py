"""
AI router — extract questions from uploaded files or raw text.
Uses OpenAI (if configured) or returns a helpful error.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from models.user import User
from auth.jwt import get_current_user
from config import settings

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ExtractRequest(BaseModel):
    text: Optional[str] = None
    file_url: Optional[str] = None


class ExtractedQuestion(BaseModel):
    label: str
    type: str
    required: bool = True
    options: List[str] = []


class ExtractResponse(BaseModel):
    questions: List[ExtractedQuestion]


@router.post("/extract-questions", response_model=ExtractResponse)
async def extract_questions(
    data: ExtractRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Extract structured questions from raw text or an uploaded file.
    Requires OPENAI_API_KEY to be set in environment.
    """
    if not data.text and not data.file_url:
        raise HTTPException(status_code=400, detail="Provide either 'text' or 'file_url'")

    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=501,
            detail="AI question extraction is not configured. Set OPENAI_API_KEY in .env",
        )

    # TODO: Implement actual AI extraction using OpenAI/Claude/Gemini
    # For now, return a placeholder that demonstrates the expected format
    try:
        import openai

        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        content = data.text or f"Extract questions from the file at: {data.file_url}"
        prompt = (
            "You are a form-building assistant. Extract structured form questions from the "
            "following text. For each question, determine the best field type from: "
            "short_text, long_text, multiple_choice, checkbox, dropdown, date, number, email. "
            "Return ONLY a JSON array of objects with keys: label, type, required, options. "
            "The options array should only be populated for multiple_choice, checkbox, and dropdown types.\n\n"
            f"Text:\n{content}"
        )

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )

        import json
        result = json.loads(response.choices[0].message.content)
        questions = result.get("questions", result) if isinstance(result, dict) else result
        return {"questions": questions}

    except ImportError:
        raise HTTPException(status_code=501, detail="openai package not installed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")
