from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from models.user import User
from auth.jwt import get_current_user
from config import settings
from services.nvidia_ai import MaxxieAI, NvidiaAIError, build_maxxie_messages

router = APIRouter(prefix="/api/ai", tags=["ai"])


def parse_jsonish(text: str):
    import json
    import re

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text) or re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
        if not match:
            raise
        return json.loads(match.group(1))


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


class ChatRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    temperature: Optional[float] = 0.6
    max_tokens: Optional[int] = 8192
    response_json_schema: Optional[dict] = None


@router.post("/chat")
async def chat_with_maxxie(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    if not data.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    system_prompt = data.system_prompt
    if data.response_json_schema:
        system_prompt = (
            (system_prompt or "")
            + "\nReturn only valid JSON that matches the requested response schema."
        ).strip()

    try:
        maxxie = MaxxieAI(settings.NVIDIA_API_KEY)
        result = maxxie.chat(
            build_maxxie_messages([{"role": "user", "content": data.prompt}], system_prompt),
            temperature=data.temperature or 0.6,
            max_tokens=min(data.max_tokens or 8192, 16384),
            reasoning_budget=2048,
        )
        return {
            "text": result["content"],
            "reasoning": result["reasoning"],
            "model": "maxxie",
        }
    except NvidiaAIError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Maxxie request failed: {str(e)}")


@router.post("/extract-questions", response_model=ExtractResponse)
async def extract_questions(
    data: ExtractRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Extract structured questions from raw text or an uploaded file.
    Requires NVIDIA_API_KEY or OPENAI_API_KEY to be set in environment.
    """
    if not data.text and not data.file_url:
        raise HTTPException(status_code=400, detail="Provide either 'text' or 'file_url'")

    if not settings.NVIDIA_API_KEY and not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=501,
            detail="AI question extraction is not configured. Set NVIDIA_API_KEY or OPENAI_API_KEY in .env",
        )

    try:
        if settings.NVIDIA_API_KEY:
            maxxie = MaxxieAI(settings.NVIDIA_API_KEY)
            content = data.text or f"Extract questions from the file at: {data.file_url}"
            prompt = (
                "Extract structured form questions from the following text. "
                "Use only these types: short_text, long_text, multiple_choice, checkbox, dropdown, date, number, email, file_upload, rating. "
                "Return only a JSON object with a questions array. Each question must have label, type, required, and options. "
                "Only multiple_choice, checkbox, and dropdown should have options.\n\n"
                f"Text:\n{content}"
            )
            result = maxxie.chat(
                build_maxxie_messages([{"role": "user", "content": prompt}]),
                temperature=0.2,
                max_tokens=4096,
                reasoning_budget=1024,
            )
            parsed = parse_jsonish(result["content"])
            questions = parsed.get("questions", parsed) if isinstance(parsed, dict) else parsed
            return {"questions": questions}

        import openai

        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        content = data.text or f"Extract questions from the file at: {data.file_url}"
        prompt = (
            "You are a form-building assistant. Extract structured form questions from the "
            "following text. For each question, determine the best field type from: "
            "short_text, long_text, multiple_choice, checkbox, dropdown, date, number, email, file_upload, rating. "
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
