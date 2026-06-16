import os
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Support"]
)

class MagicWandRequest(BaseModel):
    text: str
    action: str 

class GenerateCanvasRequest(BaseModel):
    prompt: str
    x: float
    y: float

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    workspace_context: str = ""

@router.post("/magic-wand")
async def magic_wand(req: MagicWandRequest):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing in backend")

    client = Groq(api_key=api_key)
    
    system_prompt = (
        "You are a professional B2B SaaS Canvas assistant. "
        "Provide clear, concise, and professional results. "
        "Use Markdown format. Do not be overly wordy, just provide the result."
    )
    
    if req.action == "summarize":
        user_prompt = f"Please summarize the following text professionally:\n\n{req.text}"
    elif req.action == "brainstorm":
        user_prompt = f"Generate 5 creative and insightful ideas/points about the following topic:\n\n{req.text}"
    elif req.action == "improve":
        user_prompt = f"Proofread the following text, fix grammar, and rewrite it with a more professional and impactful tone:\n\n{req.text}"
    else:
        user_prompt = req.text

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile", 
            temperature=0.6,
            max_tokens=1024,
        )
        
        result_text = chat_completion.choices[0].message.content
        return {"result": result_text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")


@router.post("/generate-canvas")
async def generate_canvas(req: GenerateCanvasRequest):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    client = Groq(api_key=api_key)
    
    system_prompt = f"""You are an expert AI Canvas Architect for a workspace app.
    The user will give you a prompt. Return ONLY a valid JSON object.
    It MUST have a single root key called 'blocks'.
    'blocks' is an array of objects.
    EACH BLOCK MUST HAVE EXACTLY THIS STRUCTURE:
    {{
        "type": "text",
        "value": "Markdown text goes here.",
        "x": {req.x},
        "y": {req.y},
        "width": 300,
        "height": 120,
        "settings": {{"color": "#1e1e1e", "isBold": false}}
    }}
    Space the blocks out by incrementing X or Y so they don't overlap!
    CRITICAL: NO MARKDOWN TAGS. ONLY RAW JSON. Do not wrap in markdown json tags.
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"} 
        )
        
        result_text = chat_completion.choices[0].message.content.strip()
        
        if result_text.startswith('`' * 3):
            match = re.search(r'`{3}(?:json)?(.*?)`{3}', result_text, re.DOTALL)
            if match:
                result_text = match.group(1).strip()
        
        parsed_json = json.loads(result_text)
        
        if "blocks" not in parsed_json:
            if isinstance(parsed_json, list):
                parsed_json = {"blocks": parsed_json}
            else:
                parsed_json = {"blocks": []}
                
        return parsed_json
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Canvas Error: {str(e)}")

@router.post("/chat")
async def chat_with_canvas(req: ChatRequest):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    client = Groq(api_key=api_key)
    
    system_prompt = (
        "You are an intelligent AI assistant integrated into a B2B SaaS Workspace. "
        "Your job is to answer user questions based on their active canvas AND their allowed workspace projects.\n\n"
        "--- CURRENT WORKSPACE CONTEXT (Canvas & Projects) ---\n"
        f"{req.workspace_context}\n"
        "---------------------------------------------------\n\n"
        "ALWAYS base your answers on the context provided above. If a user asks about their projects, list them from the context. "
        "Keep your answers helpful, concise, professional, and ALWAYS use Markdown format."
    )
    
    groq_messages = [{"role": "system", "content": system_prompt}]
    for msg in req.messages:
        groq_messages.append({"role": msg.role, "content": msg.content})

    try:
        chat_completion = client.chat.completions.create(
            messages=groq_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1024,
        )
        return {"reply": chat_completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Chat Error: {str(e)}")