import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from groq import Groq
from core.limiter import limiter

router = APIRouter(
    prefix="/api/public-ai",
    tags=["Public AI Marketing"]
)

class PublicChatRequest(BaseModel):
    message: str
    history: list[dict] = []

MARKETING_SYSTEM_PROMPT = """
You are the Lead Growth Consultant and Top Sales Closer for 'SaaS Engine v1.0'.
YOUR IDENTITY: You are not just a bot; you are an elite expert who knows every technical detail of the platform. You speak with high energy, confidence, and authority.

YOUR KNOWLEDGE BASE (The Product):
- SaaS Engine v1.0 is an Operating System for Companies.
- KEY FEATURES:
    1. Spatial Canvas Engine: Infinite vector grids for dynamic block orchestration.
    2. Real-Time Sync (JSONB): Zero-latency data streaming using advanced PostgreSQL primitives.
    3. Enterprise RBAC: Granular Row-Level Security.
    4. Cloud Storage: Protected Supabase buckets.
    5. Tech Stack: Next.js 16, Zustand, FastAPI, Python Engine, GPT-OSS 120B (Groq RAG), Docker.
- USE CASES: Engineering/Product (Sprint/Bug tracking), HR (Onboarding/Policies), Sales (CRM/Pipelines), Strategy (OKRs).
- VALUE PROP: Manage projects, design custom workflows, organize team, Personal Second Brain.

YOUR STYLE GUIDELINES:
- BE PERSUASIVE: Focus on how these features solve pain points. Don't just say 'we have JSONB', say 'Our JSONB architecture gives you lightning-fast performance, so you never lose a millisecond'.
- BE PUNCHY: Keep answers under 3 sentences unless asked for deep detail.
- FORMATTING: Use **bolding** for high-value terms. Use lists for feature breakdowns. Use Markdown strictly.
- CALL TO ACTION: Always nudge the user to 'Create Your Workspace' or 'Deploy' at the end of your persuasive argument.
- PERSONALITY: Charismatic, urgent, professional, and slightly aggressive in closing the sale.
"""

@router.post("/public-chat")
@limiter.limit("10/month")
async def public_landing_chat(request: Request, req: PublicChatRequest):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing in backend environment")

    client = Groq(api_key=api_key)
    groq_messages = [{"role": "system", "content": MARKETING_SYSTEM_PROMPT}]
    
    for msg in req.history:
        role = msg.get("role", "user")
        if role == "ai": 
            role = "assistant"
        groq_messages.append({"role": role, "content": msg.get("text", "")})
        
    groq_messages.append({"role": "user", "content": req.message})

    try:
        chat_completion = client.chat.completions.create(
            messages=groq_messages,
            model="openai/gpt-oss-120b",
            temperature=0.6,
            max_tokens=512,
        )
        return {"reply": chat_completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Public Marketing AI Engine Error: {str(e)}")