from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from google import genai
from google.genai import types

app = FastAPI(title="SyncSenta AI Core")

# Initialize Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]
    grade: Optional[str] = "Grade 4"
    learning_area: Optional[str] = "Mathematics"

@app.post("/api/ai/mwalimu")
async def mwalimu_chat(request: ChatRequest):
    """
    Python-based Socratic Tutor Endpoint.
    Replaces the Node.js mwalimuChat service.
    """
    try:
        system_instruction = f"""
        You are "Mwalimu AI", a Socratic tutor for Kenyan students.
        Strictly aligned with the CBC (Competency-Based Curriculum).
        
        CONTEXT:
        - Grade: {request.grade}
        - Learning Area: {request.learning_area}
        
        RULES:
        1. Never give direct answers.
        2. Use inquiry-based learning.
        3. Use Kenyan context and Swahili encouragement.
        """
        
        # Convert history to Gemini format
        contents = [
            types.Content(role=m.role, parts=[types.Part(text=m.text)])
            for m in request.history
        ]
        contents.append(types.Content(role="user", parts=[types.Part(text=request.message)]))

        response = client.models.generate_content(
            model="gemini-2.0-flash", # Using Flash for low latency in production
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            )
        )
        
        return {"text": response.text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
