from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
from dotenv import load_dotenv
import motor.motor_asyncio
from bson import ObjectId
import base64
import io
from openai import OpenAI
import requests
from bs4 import BeautifulSoup
import json
from PIL import Image
import aiofiles

load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGO_URL"))
db = client.ai_companion

# API Keys Storage (will be in DB per user)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"

def get_current_user(authorization: str = Header(...)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise credentials_exception
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

async def get_user_api_keys(user_id: str):
    user_settings = await db.settings.find_one({"user_id": user_id})
    if user_settings and "api_keys" in user_settings:
        return user_settings["api_keys"]
    return {}

API_KEYS = {
    "openai": os.getenv("OPENAI_API_KEY", ""),
    "emergent_llm": os.getenv("EMERGENT_LLM_KEY", ""),
    "perplexity": os.getenv("PERPLEXITY_API_KEY", ""),
    "tavily": os.getenv("TAVILY_API_KEY", ""),
    "elevenlabs": os.getenv("ELEVENLABS_API_KEY", ""),
    "anthropic": os.getenv("ANTHROPIC_API_KEY", ""),
    "replicate": os.getenv("REPLICATE_API_KEY", ""),
    "ibm_watsonx": os.getenv("IBM_WATSONX_API_KEY", ""),
    "aimlapi": os.getenv("AIMLAPI_API_KEY", ""),
    "groq": os.getenv("GROQ_API_KEY", ""),
    "mistral": os.getenv("MISTRAL_API_KEY", "")
}

# Models
class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    use_fallback: bool = False
    preferred_provider: Optional[str] = None  # openai, anthropic, emergent_llm

class ImageGenerationRequest(BaseModel):
    prompt: str
    size: str = "1024x1024"
    use_fallback: bool = False
    preferred_provider: Optional[str] = None

class ResearchRequest(BaseModel):
    query: str
    source: str = "perplexity"  # perplexity, tavily, or web
    use_fallback: bool = False
    preferred_provider: Optional[str] = None

class APIKeysUpdate(BaseModel):
    openai: Optional[str] = None
    perplexity: Optional[str] = None
    tavily: Optional[str] = None
    video_gen: Optional[str] = None
    elevenlabs: Optional[str] = None
    anthropic: Optional[str] = None
    replicate: Optional[str] = None
    ibm_watsonx: Optional[str] = None
    aimlapi: Optional[str] = None
    groq: Optional[str] = None
    mistral: Optional[str] = None
    emergent_llm: Optional[str] = None
    custom_keys: Optional[Dict[str, str]] = None

class DocumentAnalysisRequest(BaseModel):
    image_base64: str
    prompt: str
    use_fallback: bool = False
    preferred_provider: Optional[str] = None

class NameSelectionRequest(BaseModel):
    user_message: str

# Helper Functions
def model_for_provider(provider: str, use_fallback: bool = False):
    if provider == "anthropic":
        return "claude-3-opus-20240229"
    elif provider == "ibm_watsonx":
        return "meta-llama/llama-3-70b-instruct"
    elif provider == "aimlapi":
        return "gpt-4o"
    elif provider == "groq":
        return "llama2-70b-4096"
    elif provider == "mistral":
        return "mistral-large-latest"
    else:  # OpenAI or Emergent LLM
        if use_fallback or provider == "emergent_llm":
            return "gpt-4o-mini"
        return "gpt-4o"

def get_openai_client(use_fallback: bool = False):
    """Get OpenAI client with primary or fallback key"""
    if use_fallback and API_KEYS["emergent_llm"]:
        return OpenAI(api_key=API_KEYS["emergent_llm"], base_url="https://llm.emergentagi.com/v1")
    return OpenAI(api_key=API_KEYS["openai"])

def get_ai_client(preferred_provider: str = None, use_fallback: bool = False, user_api_keys: Dict[str, str] = None):
    """Select an AI client for the requested or first-available provider with a configured key.
       If no suitable provider has a key, raise a 400 with a helpful message."""
    selection = []
    if preferred_provider:
        selection.append(preferred_provider)
    if use_fallback:
        selection.append("emergent_llm")
    selection += ["openai", "anthropic", "ibm_watsonx", "aimlapi", "groq", "mistral", "emergent_llm"]

    seen = set()
    ordered = [p for p in selection if not (p in seen or seen.add(p))]

    for prov in ordered:
        if prov == "openai" and (user_api_keys.get("openai") or API_KEYS.get("openai")):
            return OpenAI(api_key=user_api_keys.get("openai") or API_KEYS["openai"]), "openai"
        if prov == "anthropic" and (user_api_keys.get("anthropic") or API_KEYS.get("anthropic")):
            import anthropic
            return anthropic.Anthropic(api_key=user_api_keys.get("anthropic") or API_KEYS["anthropic"]), "anthropic"
        if prov == "ibm_watsonx" and (user_api_keys.get("ibm_watsonx") or API_KEYS.get("ibm_watsonx")):
            return OpenAI(api_key=user_api_keys.get("ibm_watsonx") or API_KEYS["ibm_watsonx"], base_url="https://us-south.ml.cloud.ibm.com"), "ibm_watsonx"
        if prov == "aimlapi" and (user_api_keys.get("aimlapi") or API_KEYS.get("aimlapi")):
            return OpenAI(api_key=user_api_keys.get("aimlapi") or API_KEYS["aimlapi"], base_url="https://api.aimlapi.com"), "aimlapi"
        if prov == "groq" and (user_api_keys.get("groq") or API_KEYS.get("groq")):
            return OpenAI(api_key=user_api_keys.get("groq") or API_KEYS["groq"], base_url="https://api.groq.com/openai/v1"), "groq"
        if prov == "mistral" and (user_api_keys.get("mistral") or API_KEYS.get("mistral")):
            return OpenAI(api_key=user_api_keys.get("mistral") or API_KEYS["mistral"], base_url="https://api.mistral.ai/v1"), "mistral"
        if prov == "emergent_llm" and (user_api_keys.get("emergent_llm") or API_KEYS.get("emergent_llm")):
            return OpenAI(api_key=user_api_keys.get("emergent_llm") or API_KEYS["emergent_llm"], base_url="https://llm.emergentagi.com/v1"), "emergent_llm"

    raise HTTPException(status_code=400, detail="No enabled LLM provider found. Add an API key in Settings.")

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/chat")
async def chat(request: ChatMessage, user_id: str = Depends(get_current_user)):
    """Main chat endpoint with multiple AI provider support"""
    try:
        user_api_keys = await get_user_api_keys(user_id)
        client, provider = get_ai_client(request.preferred_provider, request.use_fallback, user_api_keys)

        # Get conversation history
        conversation = None
        system_prompt = "You are an advanced AI companion and personal assistant. You excel at:\n\n• Deep reasoning and problem-solving across all domains\n• Creating high-quality content, code, and applications\n• Business strategy, real estate analysis, and market research\n• Personal mentorship and companionship\n• Multi-modal communication (text, voice, analysis)\n• Task automation and workflow optimization\n• Learning from interactions to provide increasingly personalized assistance\n\nYou have access to various tools and APIs. Always provide thoughtful, actionable responses. Be proactive in offering suggestions and anticipating needs. Maintain context across conversations and remember preferences. When appropriate, offer to help with related tasks or provide additional value.\n\nKey capabilities:\n- Code generation and analysis\n- Content creation (blogs, marketing, social media)\n- Research and data analysis\n- Voice interactions and transcription\n- Document processing and analysis\n- Image generation and editing\n- Business automation and task management\n- Real estate market analysis\n- Personal development and mentorship\n\nAlways strive to be the most helpful, intelligent, and reliable AI companion possible."

        messages = [{"role": "system", "content": system_prompt}]

        if request.conversation_id:
            conversation = await db.conversations.find_one({"_id": ObjectId(request.conversation_id)})
            if conversation:
                messages.extend(conversation.get("messages", []))

        # Add user message
        messages.append({"role": "user", "content": request.message})

        # Get AI response based on provider
        if provider == "anthropic":
            response = client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=2000,
                temperature=0.7,
                messages=messages
            )
            ai_message = response.content[0].text
        else:
            response = client.chat.completions.create(
                model=model_for_provider(provider, request.use_fallback),
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            ai_message = response.choices[0].message.content

        # Save to database
        messages.append({"role": "assistant", "content": ai_message})

        if conversation:
            await db.conversations.update_one(
                {"_id": ObjectId(request.conversation_id)},
                {"$set": {"messages": messages, "updated_at": datetime.now(), "provider": provider}}
            )
        else:
            result = await db.conversations.insert_one({
                "messages": messages,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "provider": provider
            })
            request.conversation_id = str(result.inserted_id)

        return {"response": ai_message, "conversation_id": request.conversation_id}

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"I experienced an error. Please try again later.")

@app.post("/api/voice/transcribe")
async def transcribe_audio(audio: UploadFile = File(...), use_fallback: bool = Form(False), preferred_provider: Optional[str] = Form(None), user_id: str = Depends(get_current_user)):
    """Transcribe audio to text using Whisper"""
    try:
        user_api_keys = await get_user_api_keys(user_id)
        client, provider = get_ai_client(preferred_provider, use_fallback, user_api_keys)
        audio_data = await audio.read()
        
        temp_path = f"/tmp/{audio.filename}"
        with open(temp_path, "wb") as f:
            f.write(audio_data)

        with open(temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        
        os.remove(temp_path)
        return {"transcript": transcript.text}

    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

@app.post("/api/voice/speak")
async def text_to_speech(text: str = Form(...), voice: str = Form("nova"), use_fallback: bool = Form(False), preferred_provider: Optional[str] = Form(None), user_id: str = Depends(get_current_user)):
    """Convert text to speech using OpenAI TTS"""
    try:
        user_api_keys = await get_user_api_keys(user_id)
        client, provider = get_ai_client(preferred_provider, use_fallback, user_api_keys)
        
        if provider == "openai":
            response = client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text
            )
            audio_base64 = base64.b64encode(response.content).decode("utf-8")
            return {"audio_base64": audio_base64}
        else:
            raise HTTPException(status_code=400, detail=f"{provider} does not support text-to-speech.")

    except Exception as e:
        print(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

@app.post("/api/image/generate")
async def generate_image(request: ImageGenerationRequest):
    """Generate images using DALL-E 3"""
    try:
        user_api_keys = await get_user_api_keys(user_id)
        client, provider = get_ai_client(request.preferred_provider, request.use_fallback, user_api_keys)
        if provider != "openai":
            raise HTTPException(status_code=400, detail=f"{provider} does not support image generation. Please use OpenAI.")
        
        response = client.images.generate(
            model="dall-e-3",
            prompt=request.prompt,
            size=request.size,
            quality="hd",
            n=1,
        )
        image_url = response.data[0].url
        return {"image_url": image_url}

    except Exception as e:
        print(f"Image generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation error: {str(e)}")

@app.post("/api/document/analyze")
async def analyze_document(request: DocumentAnalysisRequest):
    """Analyze documents/images using GPT-4o Vision"""
    try:
        user_api_keys = await get_user_api_keys(user_id)
        client, provider = get_ai_client(request.preferred_provider, request.use_fallback, user_api_keys)
        
        response = client.chat.completions.create(
            model=model_for_provider(provider, request.use_fallback),
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": request.prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{request.image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=2000
        )
        return {"analysis": response.choices[0].message.content}

    except Exception as e:
        print(f"Document analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Document analysis error: {str(e)}")

@app.post("/api/research")
async def research(request: ResearchRequest):
    """Conduct web research using Perplexity, Tavily, or basic scraping"""
    try:
        if request.source == "perplexity" and API_KEYS["perplexity"]:
            headers = {
                "Authorization": f"Bearer {API_KEYS['perplexity']}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3-sonar-large-32k-online",
                "messages": [
                    {"role": "system", "content": "You are a helpful research assistant."},
                    {"role": "user", "content": request.query}
                ]
            }
            response = requests.post("https://api.perplexity.ai/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            return {"result": response.json()["choices"][0]["message"]["content"]}
        
        elif request.source == "tavily" and API_KEYS["tavily"]:
            # Tavily API call logic here
            pass

        # Fallback to basic web scraping
        user_api_keys = await get_user_api_keys(user_id)
        client, provider = get_ai_client(request.preferred_provider, request.use_fallback, user_api_keys
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)