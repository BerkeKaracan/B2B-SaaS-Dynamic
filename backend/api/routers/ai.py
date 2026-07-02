import os
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import AsyncGroq  

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
    
    system_prompt = f"""You are an expert AI Canvas Architect for a B2B SaaS application.
    The user will describe a workspace, process, database, or dashboard they want to create.
    You MUST return ONLY a valid JSON object representing a SINGLE Page.
    
    --- PAGE TEMPLATES & CUSTOM PAGES ---
    1. STANDARD TEMPLATES: "kanban", "notes", "document", "database", "whiteboard", "mindmap", "retrospective", "timeline".
       - For these, set "type" to the template name. 
       - You MUST populate their initial data CREATIVELY inside a "metadata" object! Provide realistic, industry-specific mock data based on the user's prompt.
       
       * DATABASE Example Data Structure (Inside "metadata"):
         "databaseTitle": "<Creative Database Title>",
         "databaseProperties": [
            {{"id": "prop-1", "name": "Task Name", "type": "text"}},
            {{"id": "prop-2", "name": "Status", "type": "select"}},
            {{"id": "prop-3", "name": "Deadline", "type": "date"}},
            {{"id": "prop-4", "name": "Budget", "type": "number"}}
         ],
         "databaseRows": [
            {{"id": "row-1", "prop-1": "Q3 Marketing Campaign", "prop-2": "In Progress", "prop-3": "2024-09-15", "prop-4": 50000}},
            {{"id": "row-2", "prop-1": "Website Redesign", "prop-2": "Pending", "prop-3": "2024-10-01", "prop-4": 12000}}
         ]
         
       * KANBAN Example Data Structure (Inside "metadata"):
         "kanbanColumns": [{{"id": "col-1", "title": "To Do"}}, {{"id": "col-2", "title": "In Progress"}}],
         "kanbanTasks": [{{"id": "task-1", "columnId": "col-1", "content": "Design Homepage"}}]

      * MINDMAP Example Data Structure (Inside "metadata"):
         "mindmapNodes": [
            {{"id": "root", "text": "SaaS Product Launch", "x": 500, "y": 300, "parentId": null, "color": "bg-indigo-600"}},
            {{"id": "node-1", "text": "Marketing", "x": 300, "y": 150, "parentId": "root", "color": "bg-white"}},
            {{"id": "node-2", "text": "Development", "x": 700, "y": 150, "parentId": "root", "color": "bg-white"}},
            {{"id": "node-3", "text": "Sales", "x": 500, "y": 500, "parentId": "root", "color": "bg-white"}}
         ]

      * NOTES / DOCUMENT Example Data Structure (Inside "metadata"):
         "notepadTitle": "Q3 Marketing Strategy Notes",
         "notepadTexts": [
            {{"id": "text-1", "x": 100, "y": 100, "content": "1. Launch Campaign by Oct 15", "color": "#18181b", "size": 32, "font": "Inter"}},
            {{"id": "text-2", "x": 100, "y": 160, "content": "Needs approval from CEO", "color": "#ef4444", "size": 24, "font": "Inter"}},
            {{"id": "text-3", "x": 100, "y": 220, "content": "- Set budget: $50K\n- Assign team", "color": "#3b82f6", "size": 24, "font": "Inter"}}
         ],
         "notepadStrokes": []
    
      * DOCUMENT Example Data Structure (Inside "metadata"):
         "documentTitle": "Project Requirements Document",
         "documentContent": "## Overview\nThis document outlines the core objectives of the project.\n\n## Goals\n- Increase user retention by 20%\n- Optimize loading speeds."

    2. CUSTOM PAGES (Blank Canvas with Blocks): 
       - Use "type": "empty".
       - Populate the "blocks" array creatively.
       - ALLOWED BLOCK TYPES: "text", "form", "date", "dropdown", "checkbox", "badge_selector", "asset_stream".
       - CRITICAL: Space out blocks vertically! Increment 'y' by 145 for each new block.

    JSON STRUCTURE MUST BE EXACTLY THIS:
    {{
        "type": "<PAGE_TYPE>",
        "title": "<A creative, relevant professional title>",
        "x": {req.x},
        "y": {req.y},
        "width": 1000,
        "height": 800,
        "metadata": {{
            // POPULATE databaseProperties, databaseRows, databaseTitle, kanbanColumns, etc. HERE!
        }},
        "blocks": [
            // ONLY if type is "empty".
        ]
    }}
    
    CRITICAL RULES: 
    - Output RAW JSON ONLY. DO NOT wrap the output in Markdown tags like ```json.
    - BE HIGHLY CREATIVE! Generate at least 5 properties and 6 rows of rich, professional mock data if a database is requested.
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
            parsed_json = {
                "type": "empty",
                "title": "AI Generated Workspace",
                "blocks": parsed_json
            }
            
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