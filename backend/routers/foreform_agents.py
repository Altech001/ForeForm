import datetime
import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from openai import OpenAI
from cerebras.cloud.sdk import Cerebras

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import get_db
from auth.jwt import get_current_user
from models.user import User
from models.agent_session import AgentSession
from models.api_key import ApiKey
from schemas.agent import (
    AgentSessionCreate, AgentSessionUpdate, AgentSessionOut, AgentSessionSummary,
    ApiKeyCreate, ApiKeyUpdate, ApiKeyOut, ApiKeyFull,
)

router = APIRouter(prefix="/api/agent", tags=["agent"])


# ══════════════════════════════════════════════════════════════
#  AGENT SESSIONS — Chat history persistence (vector-style)
# ══════════════════════════════════════════════════════════════

@router.get("/sessions", response_model=List[AgentSessionSummary])
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all chat sessions for the current user (summaries only)."""
    rows = (
        db.query(AgentSession)
        .filter(AgentSession.user_id == current_user.id)
        .order_by(AgentSession.updated_at.desc())
        .all()
    )
    results = []
    for r in rows:
        results.append(AgentSessionSummary(
            id=r.id,
            title=r.title,
            model_used=r.model_used,
            is_pinned=r.is_pinned,
            message_count=len(r.messages) if r.messages else 0,
            created_at=r.created_at,
            updated_at=r.updated_at,
        ))
    return results


@router.post("/sessions", response_model=AgentSessionOut, status_code=201)
def create_session(
    data: AgentSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new agent chat session."""
    session = AgentSession(
        user_id=current_user.id,
        title=data.title or "Untitled Chat",
        messages=data.messages,
        artifacts=data.artifacts,
        model_used=data.model_used,
        metadata_=data.metadata or {},
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _session_to_out(session)


@router.get("/sessions/{session_id}", response_model=AgentSessionOut)
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single chat session with full messages."""
    session = db.query(AgentSession).filter(
        AgentSession.id == session_id,
        AgentSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _session_to_out(session)


@router.put("/sessions/{session_id}", response_model=AgentSessionOut)
def update_session(
    session_id: str,
    data: AgentSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a chat session (messages, title, etc.)."""
    session = db.query(AgentSession).filter(
        AgentSession.id == session_id,
        AgentSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if data.title is not None:
        session.title = data.title
    if data.messages is not None:
        session.messages = data.messages
    if data.artifacts is not None:
        session.artifacts = data.artifacts
    if data.model_used is not None:
        session.model_used = data.model_used
    if data.metadata is not None:
        session.metadata_ = data.metadata
    if data.is_pinned is not None:
        session.is_pinned = data.is_pinned

    session.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(session)
    return _session_to_out(session)


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a chat session."""
    session = db.query(AgentSession).filter(
        AgentSession.id == session_id,
        AgentSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()


def _session_to_out(session: AgentSession) -> AgentSessionOut:
    return AgentSessionOut(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        messages=session.messages or [],
        artifacts=session.artifacts or [],
        model_used=session.model_used,
        metadata=session.metadata_ or {},
        is_pinned=session.is_pinned,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


# ══════════════════════════════════════════════════════════════
#  API KEYS — Multi-key management with sharing
# ══════════════════════════════════════════════════════════════

@router.get("/keys", response_model=List[ApiKeyOut])
def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all API keys for the current user."""
    keys = (
        db.query(ApiKey)
        .filter(ApiKey.user_id == current_user.id)
        .order_by(ApiKey.created_at.desc())
        .all()
    )
    return [_key_to_out(k) for k in keys]


@router.post("/keys", response_model=ApiKeyOut, status_code=201)
def create_api_key(
    data: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new API key."""
    # If this is default, un-default the current default for this provider
    if data.is_default:
        db.query(ApiKey).filter(
            ApiKey.user_id == current_user.id,
            ApiKey.provider == data.provider,
            ApiKey.is_default == True,
        ).update({"is_default": False})

    key = ApiKey(
        user_id=current_user.id,
        provider=data.provider,
        label=data.label,
        api_key=data.api_key,
        is_shared=data.is_shared,
        is_default=data.is_default,
    )
    db.add(key)
    db.commit()
    db.refresh(key)
    return _key_to_out(key)


@router.put("/keys/{key_id}", response_model=ApiKeyOut)
def update_api_key(
    key_id: str,
    data: ApiKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an API key."""
    key = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.user_id == current_user.id,
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    if data.label is not None:
        key.label = data.label
    if data.api_key is not None:
        key.api_key = data.api_key
    if data.is_shared is not None:
        key.is_shared = data.is_shared
    if data.is_active is not None:
        key.is_active = data.is_active
    if data.is_default is not None:
        if data.is_default:
            db.query(ApiKey).filter(
                ApiKey.user_id == current_user.id,
                ApiKey.provider == key.provider,
                ApiKey.is_default == True,
                ApiKey.id != key_id,
            ).update({"is_default": False})
        key.is_default = data.is_default

    key.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(key)
    return _key_to_out(key)


@router.delete("/keys/{key_id}", status_code=204)
def delete_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an API key."""
    key = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.user_id == current_user.id,
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    db.delete(key)
    db.commit()


@router.get("/keys/resolve/{provider}")
def resolve_api_key(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Resolve the best API key to use for a given provider.
    Priority: 1) User's own default key  2) User's any active key  3) Any shared active key from other users
    """
    # 1. User's own default key
    key = db.query(ApiKey).filter(
        ApiKey.user_id == current_user.id,
        ApiKey.provider == provider,
        ApiKey.is_active == True,
        ApiKey.is_default == True,
    ).first()

    # 2. User's any active key
    if not key:
        key = db.query(ApiKey).filter(
            ApiKey.user_id == current_user.id,
            ApiKey.provider == provider,
            ApiKey.is_active == True,
        ).first()

    # 3. Any shared key from other users
    if not key:
        key = db.query(ApiKey).filter(
            ApiKey.provider == provider,
            ApiKey.is_shared == True,
            ApiKey.is_active == True,
        ).first()

    if not key:
        return {"api_key": None, "source": "none"}

    # Track usage
    key.usage_count = str(int(key.usage_count or "0") + 1)
    key.last_used_at = datetime.datetime.utcnow()
    db.commit()

    source = "own" if key.user_id == current_user.id else "shared"
    return {"api_key": key.api_key, "source": source, "provider": provider, "label": key.label}


def _key_to_out(key: ApiKey) -> ApiKeyOut:
    masked = "•" * max(0, len(key.api_key) - 4) + key.api_key[-4:] if key.api_key else ""
    return ApiKeyOut(
        id=key.id,
        user_id=key.user_id,
        provider=key.provider,
        label=key.label,
        api_key_masked=masked,
        is_shared=key.is_shared,
        is_active=key.is_active,
        is_default=key.is_default,
        usage_count=key.usage_count or "0",
        last_used_at=key.last_used_at,
        created_at=key.created_at,
    )


# ══════════════════════════════════════════════════════════════
#  CUSTOM CHAT ENDPOINT (Groq, Cerebras)
# ══════════════════════════════════════════════════════════════

class CustomChatPart(BaseModel):
    text: Optional[str] = None
    functionCall: Optional[Dict[str, Any]] = None
    functionResponse: Optional[Dict[str, Any]] = None

class CustomChatMessage(BaseModel):
    role: str
    parts: List[CustomChatPart]

class CustomChatRequest(BaseModel):
    provider: str
    history: List[CustomChatMessage]
    config: Optional[Dict[str, Any]] = None

@router.post("/chat/custom")
def custom_chat(
    data: CustomChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fallback custom chat endpoint for Groq and Cerebras using OpenAI/Cerebras SDK."""
    openai_messages = []
    
    system_instruction = data.config.get("systemInstruction") if data.config else None
    if system_instruction:
        openai_messages.append({"role": "system", "content": system_instruction})

    for msg in data.history:
        role = "assistant" if msg.role == "model" else "user"
        content_lines = []
        for p in msg.parts:
            if p.text:
                content_lines.append(p.text)
            if p.functionResponse:
                content_lines.append(f"Function Result ({p.functionResponse.get('name', 'unknown')}): {p.functionResponse.get('response', '')}")
        
        # Only add message if content is present to avoid API errors
        content_joined = "\n".join(content_lines)
        if content_joined.strip():
            openai_messages.append({"role": role, "content": content_joined})

    openai_tools = None
    if data.config and data.config.get("tools"):
        openai_tools = []
        for t in data.config.get("tools"):
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": t.get("name"),
                    "description": t.get("description"),
                    "parameters": t.get("parameters")
                }
            })

    output_parts = []
    
    import json
    def parse_completion(completion):
        msg = completion.choices[0].message
        if msg.content:
            output_parts.append({"text": msg.content})
        
        if hasattr(msg, 'tool_calls') and msg.tool_calls:
            for tc in msg.tool_calls:
                try:
                    args = json.loads(tc.function.arguments)
                except:
                    args = {}
                output_parts.append({
                    "functionCall": {
                        "name": tc.function.name,
                        "args": args
                    }
                })

    try:
        if data.provider == "groq":
            key_record = db.query(ApiKey).filter(ApiKey.provider == "groq", ApiKey.is_active == True, ApiKey.is_default == True).first()
            if not key_record:
                key_record = db.query(ApiKey).filter(ApiKey.provider == "groq", ApiKey.is_active == True).first()
            api_key = key_record.api_key if key_record else os.environ.get("GROQ_API_KEY")
            
            client = OpenAI(
                api_key=api_key or os.environ.get("GROQ_API_KEY") or "invalid",
                base_url="https://api.groq.com/openai/v1",
            )
            kwargs = {
                "messages": openai_messages,
                "model": "llama-3.3-70b-versatile",
                "max_tokens": int(data.config.get("maxOutputTokens", 4096)) if data.config else 4096,
                "temperature": float(data.config.get("temperature", 0.7)) if data.config else 0.7,
            }
            if openai_tools:
                kwargs["tools"] = openai_tools
            completion = client.chat.completions.create(**kwargs)
            parse_completion(completion)

        elif data.provider == "cerebras":
            key_record = db.query(ApiKey).filter(ApiKey.provider == "cerebras", ApiKey.is_active == True, ApiKey.is_default == True).first()
            if not key_record:
                key_record = db.query(ApiKey).filter(ApiKey.provider == "cerebras", ApiKey.is_active == True).first()
            api_key = key_record.api_key if key_record else os.environ.get("CEREBRAS_API_KEY")
            
            client = Cerebras(
                api_key=api_key or os.environ.get("CEREBRAS_API_KEY") or "invalid"
            )
            kwargs = {
                "messages": openai_messages,
                "model": "llama3.1-8b",
                "max_completion_tokens": int(data.config.get("maxOutputTokens", 4096)) if data.config else 4096,
                "temperature": float(data.config.get("temperature", 0.7)) if data.config else 0.7,
            }
            if openai_tools:
                kwargs["tools"] = openai_tools
            completion = client.chat.completions.create(**kwargs)
            parse_completion(completion)
            
        else:
            raise HTTPException(status_code=400, detail="Unknown provider")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"parts": output_parts}

