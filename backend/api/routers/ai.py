import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
import json

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
    The user will give you a prompt to generate a visual layout (like a Kanban board, mind map, or brainstorming notes).
    You MUST return ONLY a valid JSON object with a single key 'blocks', containing an array of block objects.
    The user's starting mouse coordinates are X: {req.x}, Y: {req.y}. 
    Space out the blocks logically (e.g., X + 350 for the next column).
    
    EACH BLOCK MUST HAVE EXACTLY THIS STRUCTURE:
    {{
        "type": "text",
        "value": "The text content. Use markdown (like ### or - [ ]).",
        "x": float (calculated relative to base X),
        "y": float (calculated relative to base Y),
        "width": 300,
        "height": 400,
        "settings": {{
            "color": "#1e1e1e",
            "isBold": false
        }}
    }}
    
    CRITICAL: Return ONLY raw JSON. Do not use ```json formatting blocks.
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
        
        result_text = chat_completion.choices[0].message.content
        return json.loads(result_text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Canvas Generation Error: {str(e)}")