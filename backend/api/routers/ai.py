import os
import json
import re
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from groq import AsyncGroq  
from datetime import datetime

from core.database import supabase
from core.ai_prompts import get_magic_wand_prompt, get_canvas_system_prompt, get_chat_prompt

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Support"]
)

security = HTTPBearer()

def verify_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = creds.credentials
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")
        return user_res.user
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized: Session not found")


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
async def magic_wand(req: MagicWandRequest, user = Depends(verify_user)):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing in backend")

    client = AsyncGroq(api_key=api_key)
    system_prompt = get_magic_wand_prompt()
    
    if req.action == "summarize":
        user_prompt = f"Please summarize the following text professionally:\n\n{req.text}"
    elif req.action == "brainstorm":
        user_prompt = f"Generate 5 creative and insightful ideas/points about the following topic:\n\n{req.text}"
    elif req.action == "improve":
        user_prompt = f"Proofread the following text, fix grammar, and rewrite it with a more professional and impactful tone:\n\n{req.text}"
    else:
        user_prompt = req.text

    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="openai/gpt-oss-120b", 
            temperature=0.6,
            max_tokens=1024,
        )
        return {"result": chat_completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")


@router.post("/generate-canvas")
async def generate_canvas(req: GenerateCanvasRequest, user = Depends(verify_user)):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    client = AsyncGroq(api_key=api_key)
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    system_prompt = get_canvas_system_prompt(current_date, req.x, req.y)
    
    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.prompt}
            ],
            model="openai/gpt-oss-120b",
            temperature=0.5, 
            max_tokens=2500
        )
        
        result_text = chat_completion.choices[0].message.content.strip()
        result_text = re.sub(r'^`{3}(?:json)?|`{3}$', '', result_text, flags=re.IGNORECASE).strip()
        
        start_idx, end_idx = -1, -1
        for i, char in enumerate(result_text):
            if char in ['{', '[']:
                start_idx = i
                break
        for i in range(len(result_text)-1, -1, -1):
            if result_text[i] in ['}', ']']:
                end_idx = i
                break
        if start_idx != -1 and end_idx != -1:
            result_text = result_text[start_idx:end_idx+1]
        
        try:
            parsed_json = json.loads(result_text)
        except json.JSONDecodeError:
            print(f"--- JSON PARSE RECOVERY ---\nBozuk Metin:\n{result_text}")
            parsed_json = {
                "type": "empty",
                "title": "AI Error Recovery",
                "blocks": []
            }
        
        if isinstance(parsed_json, list):
            parsed_json = {"type": "empty", "title": "AI Generated Workspace", "blocks": parsed_json}
            
        if "blocks" not in parsed_json:
            parsed_json["blocks"] = []
        if "type" not in parsed_json:
            parsed_json["type"] = "empty"
                
        return parsed_json
        
    except Exception as e:
        print(f"--- AI FATAL ERROR DETAYI ---\n{str(e)}\n-------------------------")
        raise HTTPException(status_code=500, detail=f"AI Canvas Error: {str(e)}")


@router.post("/chat")
async def chat_with_canvas(req: ChatRequest, user = Depends(verify_user)):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    client = AsyncGroq(api_key=api_key)
    
    system_prompt = get_chat_prompt(req.workspace_context)
    
    groq_messages = [{"role": "system", "content": system_prompt}]
    for msg in req.messages:
        groq_messages.append({"role": msg.role, "content": msg.content})

    async def event_generator():
        try:
            stream = await client.chat.completions.create(
                messages=groq_messages,
                model="openai/gpt-oss-120b",
                temperature=0.7,
                max_tokens=1024,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"\n\n[AI Error: {str(e)}]"

    return StreamingResponse(event_generator(), media_type="text/event-stream")