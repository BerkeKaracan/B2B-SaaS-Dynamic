import os
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import AsyncGroq  
from datetime import datetime

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

    client = AsyncGroq(api_key=api_key)
    
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
        chat_completion = await client.chat.completions.create(
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

    client = AsyncGroq(api_key=api_key)
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    system_prompt = f"""You are an expert AI Canvas Architect for a B2B SaaS application.
    You MUST return ONLY a valid JSON object. Do NOT wrap it in markdown tags.

    CRITICAL TEMPORAL CONTEXT: Today's date is {current_date}.
    
    --- TEMPLATE DATA STRUCTURE ---
    
    IF THE USER ASKS FOR NOTES, A DOCUMENT, AN ARTICLE, OR A STRATEGY:
    Set "type" to "notes".
    Inside "metadata", you MUST provide "notepadTitle" and a long Markdown string inside "notepadContent".
    Example:
    {{
        "type": "notes",
        "title": "Strategy Notes",
        "x": {req.x},
        "y": {req.y},
        "width": 1000,
        "height": 800,
        "metadata": {{
            "notepadTitle": "Strategy Notes",
            "notepadContent": "## Overview\\nThis is a plain text document."
        }},
        "blocks": []
    }}

    IF THE USER ASKS FOR A WHITEBOARD, CANVAS, BRAINSTORMING OR POST-ITS:
    Set "type" to "whiteboard".
    Inside "metadata", you MUST provide "whiteboardTitle" and a "whiteboardTexts" array.
    CRITICAL ID RULE: Every object in "whiteboardTexts" MUST HAVE A MATHEMATICALLY UNIQUE "id".
    Example:
    {{
        "type": "whiteboard",
        "title": "Brainstorming Board",
        "x": {req.x},
        "y": {req.y},
        "width": 1000,
        "height": 800,
        "metadata": {{
            "whiteboardTitle": "Creative Board",
            "whiteboardTexts": [
                {{"id": "txt-A1", "x": 100, "y": 100, "content": "First idea", "color": "#18181b", "size": 32, "font": "Inter"}}
            ],
            "whiteboardStrokes": []
        }},
        "blocks": []
    }}

    JSON STRUCTURE MUST BE EXACTLY THIS:
    {{
        "type": "<PAGE_TYPE>",
        "title": "<TITLE>",
        "x": {req.x},
        "y": {req.y},
        "width": 1000,
        "height": 800,
        "metadata": {{
            // REQUIRED FIELDS FOR THE TYPE GO HERE!
        }},
        "blocks": []
    }}
    """
    
    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5, 
            max_tokens=2500,
            response_format={"type": "json_object"}
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
        
        parsed_json = json.loads(result_text)
        
        if isinstance(parsed_json, list):
            parsed_json = {"type": "empty", "title": "AI Generated Workspace", "blocks": parsed_json}
        if "blocks" not in parsed_json:
            parsed_json["blocks"] = []
        if "type" not in parsed_json:
            parsed_json["type"] = "empty"
                
        return parsed_json
        
    except Exception as e:
        print("--- AI PARSE ERROR ---")
        raise HTTPException(status_code=500, detail=f"AI Canvas Error: {str(e)}")

@router.post("/chat")
async def chat_with_canvas(req: ChatRequest):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    client = AsyncGroq(api_key=api_key)
    
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
        chat_completion = await client.chat.completions.create(
            messages=groq_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1024,
        )
        return {"reply": chat_completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Chat Error: {str(e)}")