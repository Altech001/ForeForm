import os
from typing import Any, Dict, List, Optional

from openai import OpenAI


NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"


class NvidiaAIError(RuntimeError):
    pass


class MaxxieAI:
    """NVIDIA-backed AI service for ForeForm's default assistant, Maxxie."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("NVIDIA_API_KEY", "")
        if not self.api_key:
            raise NvidiaAIError("NVIDIA_API_KEY is not configured")
        self.client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=self.api_key)

    def chat(
        self,
        messages: List[Dict[str, str]],
        *,
        temperature: float = 0.6,
        top_p: float = 0.95,
        max_tokens: int = 8192,
        reasoning_budget: int = 2048,
        enable_thinking: bool = True,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        kwargs: Dict[str, Any] = {
            "model": NVIDIA_MODEL,
            "messages": messages,
            "temperature": temperature,
            "top_p": top_p,
            "max_tokens": max_tokens,
            "extra_body": {
                "chat_template_kwargs": {"enable_thinking": enable_thinking},
                "reasoning_budget": reasoning_budget,
            },
            "stream": False,
        }
        if tools:
            kwargs["tools"] = tools

        completion = self.client.chat.completions.create(**kwargs)
        message = completion.choices[0].message

        return {
            "content": message.content or "",
            "reasoning": getattr(message, "reasoning_content", None),
            "tool_calls": getattr(message, "tool_calls", None),
            "raw": completion,
        }


def build_maxxie_messages(
    messages: List[Dict[str, str]],
    system_prompt: Optional[str] = None,
) -> List[Dict[str, str]]:
    default_prompt = (
        "You are Maxxie, ForeForm's fast AI form-building assistant. "
        "Be concise, practical, and accurate. When asked to generate forms, "
        "return clean JSON when the user requests JSON or the surrounding app requires it."
    )
    output = [{"role": "system", "content": system_prompt or default_prompt}]
    output.extend(messages)
    return output
