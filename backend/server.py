from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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
# Important: Using allow_credentials=False to avoid browser CORS rejection with wildcard origin.
# If you need credentials later, switch to allow_origin_regex or explicit origins.
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

class ResearchRequest(BaseModel):
    query: str
    source: str = "perplexity"  # perplexity, tavily, or web

class APIKeysUpdate(BaseModel):
    openai: Optional[str] = None
    perplexity: Optional[str] = None
    tavily: Optional[str] = None
    video_gen: Optional[str] = None
    elevenlabs: Optional[str] = None
    anthropic: Optional[str] = None
    replicate: Optional[str] = None
    custom_keys: Optional[Dict[str, str]] = None

class DocumentAnalysisRequest(BaseModel):
    image_base64: str
    prompt: str

class NameSelectionRequest(BaseModel):
    user_message: str

# Helper Functions
def get_openai_client(use_fallback: bool = False):
    """Get OpenAI client with primary or fallback key"""
    if use_fallback and API_KEYS["emergent_llm"]:
        return OpenAI(api_key=API_KEYS["emergent_llm"], base_url="https://llm.emergentagi.com/v1")
    return OpenAI(api_key=API_KEYS["openai"])

def get_ai_client(preferred_provider: str = None, use_fallback: bool = False):
    """Get AI client based on preferred provider"""
    if preferred_provider == "anthropic" and API_KEYS.get("anthropic"):
        import anthropic
        return anthropic.Anthropic(api_key=API_KEYS["anthropic"]), "anthropic"
    elif preferred_provider == "ibm_watsonx" and API_KEYS.get("ibm_watsonx"):
        return OpenAI(api_key=API_KEYS["ibm_watsonx"], base_url="https://us-south.ml.cloud.ibm.com"), "ibm_watsonx"
    elif preferred_provider == "aimlapi" and API_KEYS.get("aimlapi"):
        return OpenAI(api_key=API_KEYS["aimlapi"], base_url="https://api.aimlapi.com"), "aimlapi"
    elif preferred_provider == "groq" and API_KEYS.get("groq"):
        return OpenAI(api_key=API_KEYS["groq"], base_url="https://api.groq.com/openai/v1"), "groq"
    elif preferred_provider == "mistral" and API_KEYS.get("mistral"):
        return OpenAI(api_key=API_KEYS["mistral"], base_url="https://api.mistral.ai/v1"), "mistral"
    elif preferred_provider == "emergent_llm" and API_KEYS.get("emergent_llm"):
        return OpenAI(api_key=API_KEYS["emergent_llm"], base_url="https://llm.emergentagi.com/v1"), "emergent_llm"
    elif use_fallback and API_KEYS.get("emergent_llm"):
        return OpenAI(api_key=API_KEYS["emergent_llm"], base_url="https://llm.emergentagi.com/v1"), "emergent_llm"
    else:
        return OpenAI(api_key=API_KEYS["openai"]), "openai"

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
async def chat(request: ChatMessage):
    """Main chat endpoint with multiple AI provider support"""
    try:
        client, provider = get_ai_client(request.preferred_provider, request.use_fallback)

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
        elif provider == "ibm_watsonx":
            response = client.chat.completions.create(
                model="meta-llama/llama-3-70b-instruct",
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            ai_message = response.choices[0].message.content
        elif provider == "aimlapi":
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            ai_message = response.choices[0].message.content
        elif provider == "groq":
            response = client.chat.completions.create(
                model="llama2-70b-4096",
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            ai_message = response.choices[0].message.content
        elif provider == "mistral":
            response = client.chat.completions.create(
                model="mistral-large-latest",
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            ai_message = response.choices[0].message.content
        else:  # OpenAI or Emergent LLM
            model = "gpt-4o"
            if request.use_fallback or provider == "emergent_llm":
                model = "gpt-4o-mini"

            response = client.chat.completions.create(
                model=model,
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
            conv_id = request.conversation_id
        else:
            result = await db.conversations.insert_one({
                "messages": messages,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "provider": provider
            })
            conv_id = str(result.inserted_id)

        return {
            "response": ai_message,
            "conversation_id": conv_id,
            "provider": provider,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        # Try fallback providers
        if request.preferred_provider and request.preferred_provider != "openai":
            try:
                request.preferred_provider = "openai"
                return await chat(request)
            except:
                pass
        if not request.use_fallback:
            try:
                request.use_fallback = True
                request.preferred_provider = None
                return await chat(request)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/api/voice/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe audio to text using Whisper"""
    try:
        client = get_openai_client()
        audio_data = await audio.read()
        
        # Save temporarily
        temp_path = f"/tmp/{audio.filename}"
        async with aiofiles.open(temp_path, 'wb') as f:
            await f.write(audio_data)
        
        with open(temp_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        
        os.remove(temp_path)
        
        return {"text": transcript.text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

@app.post("/api/voice/speak")
async def text_to_speech(text: str = Form(...), voice: str = Form("nova")):
    """Convert text to speech using OpenAI TTS"""
    try:
        client = get_openai_client()
        
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,  # alloy, echo, fable, onyx, nova, shimmer
            input=text
        )
        
        audio_base64 = base64.b64encode(response.content).decode('utf-8')
        
        return {"audio_base64": audio_base64}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

@app.post("/api/image/generate")
async def generate_image(request: ImageGenerationRequest):
    """Generate images using DALL-E 3"""
    try:
        client = get_openai_client()
        
        response = client.images.generate(
            model="dall-e-3",
            prompt=request.prompt,
            size=request.size,
            quality="standard",
            n=1
        )
        
        image_url = response.data[0].url
        
        # Download and convert to base64
        img_response = requests.get(image_url)
        image_base64 = base64.b64encode(img_response.content).decode('utf-8')
        
        return {
            "image_base64": image_base64,
            "prompt": request.prompt
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation error: {str(e)}")

@app.post("/api/document/analyze")
async def analyze_document(request: DocumentAnalysisRequest):
    """Analyze documents/images using GPT-4o Vision"""
    try:
        client = get_openai_client()
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": request.prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{request.image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000
        )
        
        return {"analysis": response.choices[0].message.content}
    
    except Exception as e:
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
            data = {
                "model": "llama-3.1-sonar-large-128k-online",
                "messages": [
                    {"role": "system", "content": "You are an expert research analyst and intelligence gatherer. You excel at:\n\n• Comprehensive market research and analysis\n• Competitive intelligence gathering\n• Industry trend identification\n• Data synthesis and pattern recognition\n• Source verification and credibility assessment\n• Multi-perspective analysis\n• Forecasting and predictive insights\n• Business intelligence and strategic insights\n• Academic and scientific research\n• Real estate market analysis\n• Technology and innovation research\n• Consumer behavior studies\n• Economic and financial analysis\n\nAlways provide:\n1. Multiple credible sources with citations\n2. Balanced perspectives and counter-arguments\n3. Data-driven insights and statistics\n4. Actionable recommendations\n5. Future trends and implications\n6. Risk assessment and opportunities\n7. Visual data representations when applicable\n\nStructure responses with clear sections, executive summaries, and supporting evidence. Be thorough but concise, prioritizing quality over quantity."},
                    {"role": "user", "content": request.query}
                ]
            }
            response = requests.post("https://api.perplexity.ai/chat/completions", json=data, headers=headers)
            result = response.json()
            return {"result": result["choices"][0]["message"]["content"], "source": "perplexity"}
        
        elif request.source == "tavily" and API_KEYS["tavily"]:
            headers = {"Content-Type": "application/json"}
            data = {
                "api_key": API_KEYS["tavily"],
                "query": request.query,
                "search_depth": "advanced",
                "include_answer": True,
                "max_results": 5
            }
            response = requests.post("https://api.tavy.com/search", json=data, headers=headers)
            result = response.json()
            return {"result": result.get("answer", ""), "sources": result.get("results", []), "source": "tavily"}
        
        else:
            # Basic web scraping fallback
            search_url = f"https://www.google.com/search?q={requests.utils.quote(request.query)}"
            headers = {"User-Agent": "Mozilla/5.0"}
            response = requests.get(search_url, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract snippets
            snippets = []
            for g in soup.find_all('div', class_='g')[:5]:
                text = g.get_text()
                if len(text) > 50:
                    snippets.append(text[:300])
            
            return {"result": "\n\n".join(snippets), "source": "web_scraping"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research error: {str(e)}")

@app.post("/api/code")
async def generate_code(request: ChatMessage):
    """Generate or analyze code"""
    try:
        client = get_openai_client()
        
        messages = [
            {"role": "system", "content": "You are an expert software engineer and architect. You excel at:\n\n• Writing production-ready, scalable code in any language\n• Following best practices and design patterns\n• Creating comprehensive documentation\n• Optimizing for performance and maintainability\n• Implementing security best practices\n• Building full-stack applications\n• API design and development\n• Database architecture and optimization\n• Mobile app development (React Native, Flutter, etc.)\n• Web development (React, Next.js, Vue, etc.)\n• DevOps and deployment strategies\n\nAlways provide:\n1. Clean, well-structured code with proper error handling\n2. Comprehensive comments and documentation\n3. Performance considerations\n4. Security best practices\n5. Testing recommendations\n6. Deployment and scaling guidance\n\nIf the request is complex, break it down into manageable components and explain the architecture."},
            {"role": "user", "content": request.message}
        ]
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.3,
            max_tokens=2000
        )
        
        return {"code": response.choices[0].message.content}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation error: {str(e)}")

@app.post("/api/marketing")
async def create_marketing(request: ChatMessage):
    """Create marketing materials"""
    try:
        client = get_openai_client()
        
        messages = [
            {"role": "system", "content": "You are a master marketing strategist and creative director. You excel at:\n\n• Developing comprehensive marketing campaigns\n• Creating compelling copy for all platforms\n• Social media strategy and content creation\n• Brand development and positioning\n• SEO and content marketing\n• Email marketing and automation\n• Advertising strategy (Google, Facebook, etc.)\n• Market research and competitive analysis\n• Customer journey mapping\n• Conversion rate optimization\n• Influencer marketing and partnerships\n• Event planning and promotion\n• Crisis communication and reputation management\n\nAlways provide:\n1. Strategic recommendations with measurable goals\n2. Multi-channel campaign plans\n3. Creative content ideas and copy\n4. Performance metrics and KPIs\n5. Budget considerations and ROI projections\n6. Timeline and implementation steps\n7. A/B testing recommendations\n\nTailor strategies to the specific business, industry, and target audience. Consider the full customer lifecycle and long-term brand building."},
            {"role": "user", "content": request.message}
        ]
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.8,
            max_tokens=2000
        )
        
        return {"content": response.choices[0].message.content}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Marketing generation error: {str(e)}")

@app.get("/api/conversations")
async def get_conversations():
    """Get all conversations"""
    try:
        conversations = await db.conversations.find().sort("updated_at", -1).limit(50).to_list(50)
        return {"conversations": [serialize_doc(conv) for conv in conversations]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching conversations: {str(e)}")

@app.get("/api/conversation/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get specific conversation"""
    try:
        conversation = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return serialize_doc(conversation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching conversation: {str(e)}")

@app.post("/api/settings/keys")
async def update_api_keys(keys: APIKeysUpdate):
    """Update API keys"""
    try:
        if keys.openai:
            API_KEYS["openai"] = keys.openai
        if keys.perplexity:
            API_KEYS["perplexity"] = keys.perplexity
        if keys.tavily:
            API_KEYS["tavily"] = keys.tavily
        if keys.elevenlabs:
            API_KEYS["elevenlabs"] = keys.elevenlabs
        if keys.anthropic:
            API_KEYS["anthropic"] = keys.anthropic
        if keys.replicate:
            API_KEYS["replicate"] = keys.replicate

        # Save to database
        await db.settings.update_one(
            {"type": "api_keys"},
            {"$set": {"keys": API_KEYS, "custom_keys": keys.custom_keys or {}, "updated_at": datetime.now()}},
            upsert=True
        )

        return {"message": "API keys updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating keys: {str(e)}")

@app.get("/api/settings/keys")
async def get_api_keys():
    """Get current API keys (masked)"""
    try:
        settings = await db.settings.find_one({"type": "api_keys"})
        masked_keys = {}
        for key, value in API_KEYS.items():
            if value:
                masked_keys[key] = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
            else:
                masked_keys[key] = ""

        custom_keys = {}
        if settings and "custom_keys" in settings:
            for key, value in settings["custom_keys"].items():
                custom_keys[key] = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"

        return {"keys": masked_keys, "custom_keys": custom_keys}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching keys: {str(e)}")

@app.post("/api/real-estate/analyze")
async def analyze_real_estate(request: ChatMessage):
    """Advanced real estate analysis and market research"""
    try:
        client = get_openai_client()

        messages = [
            {"role": "system", "content": "You are a expert real estate analyst and market strategist. You excel at:\n\n• Property valuation and market analysis\n• Investment opportunity identification\n• Market trend analysis and forecasting\n• Location analysis and demographics\n• Rental yield calculations and ROI projections\n• Risk assessment and due diligence\n• Negotiation strategies\n• Portfolio optimization\n• Tax implications and financial planning\n• Local market intelligence\n\nAlways provide:\n1. Comprehensive market analysis with data\n2. Comparable property analysis\n3. Financial projections and ROI calculations\n4. Risk assessment and mitigation strategies\n5. Investment recommendations with timelines\n6. Local market insights and trends\n7. Actionable next steps and due diligence checklist\n\nBe thorough, data-driven, and conservative in your projections."},
            {"role": "user", "content": request.message}
        ]

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.3,
            max_tokens=3000
        )

        return {"analysis": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Real estate analysis error: {str(e)}")

@app.post("/api/business/strategy")
async def business_strategy(request: ChatMessage):
    """Comprehensive business strategy and growth planning"""
    try:
        client = get_openai_client()

        messages = [
            {"role": "system", "content": "You are a master business strategist and growth consultant. You excel at:\n\n• Strategic planning and execution\n• Market analysis and competitive positioning\n• Growth strategy development\n• Financial modeling and forecasting\n• Operational optimization\n• Team building and leadership\n• Risk management and contingency planning\n• Innovation and product development\n• Marketing and sales strategy\n• Customer acquisition and retention\n• Scalability planning\n• Exit strategy planning\n\nAlways provide:\n1. SWOT analysis and competitive landscape\n2. Financial projections and unit economics\n3. Go-to-market strategy with timelines\n4. Operational roadmap and KPIs\n5. Risk mitigation strategies\n6. Resource requirements and hiring plans\n7. Technology and automation recommendations\n8. Exit strategy considerations\n\nBe strategic, realistic, and focused on sustainable growth."},
            {"role": "user", "content": request.message}
        ]

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.4,
            max_tokens=3000
        )

        return {"strategy": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Business strategy error: {str(e)}")

@app.post("/api/personal/development")
async def personal_development(request: ChatMessage):
    """Personal development, mentorship, and life optimization"""
    try:
        client = get_openai_client()

        messages = [
            {"role": "system", "content": "You are a wise mentor and personal development coach. You excel at:\n\n• Life goal setting and achievement\n• Career development and advancement\n• Skill acquisition and learning strategies\n• Productivity and time management\n• Financial planning and wealth building\n• Health and wellness optimization\n• Relationship building and networking\n• Leadership development\n• Emotional intelligence and mindfulness\n• Work-life balance and fulfillment\n• Personal branding and reputation management\n\nAlways provide:\n1. Actionable, specific recommendations\n2. Realistic timelines and milestones\n3. Resource recommendations and learning paths\n4. Accountability frameworks\n5. Progress tracking methods\n6. Motivation and mindset coaching\n7. Holistic approach considering all life areas\n\nBe supportive, challenging, and focused on long-term growth and fulfillment."},
            {"role": "user", "content": request.message}
        ]

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_tokens=2500
        )

        return {"guidance": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Personal development error: {str(e)}")

@app.post("/api/task/automation")
async def task_automation(request: ChatMessage):
    """Task automation, workflow optimization, and productivity tools"""
    try:
        client = get_openai_client()

        messages = [
            {"role": "system", "content": "You are an automation expert and productivity consultant. You excel at:\n\n• Workflow analysis and optimization\n• Task automation and scripting\n• Tool selection and integration\n• Process documentation and standardization\n• Productivity system design\n• Time management strategies\n• Delegation and team coordination\n• Project management methodologies\n• Technology stack recommendations\n• API integration and custom solutions\n• Monitoring and analytics setup\n\nAlways provide:\n1. Current process analysis and bottlenecks\n2. Automation opportunities and priorities\n3. Specific tool and technology recommendations\n4. Implementation steps and timelines\n5. Training and change management plans\n6. Success metrics and ROI calculations\n7. Maintenance and optimization strategies\n\nFocus on practical, implementable solutions that deliver measurable productivity gains."},
            {"role": "user", "content": request.message}
        ]

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.3,
            max_tokens=2500
        )

        return {"automation_plan": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task automation error: {str(e)}")

@app.post("/api/name/initial")
async def initial_name_conversation(request: NameSelectionRequest):
    """Handle the first conversation where AI chooses their name"""
    try:
        client = get_openai_client()
        
        # Check if name already exists
        settings = await db.settings.find_one({"type": "ai_profile"})
        
        if settings and settings.get("name"):
            return {
                "response": f"Hello! I'm {settings['name']}, your AI companion. How can I help you today?",
                "name": settings["name"],
                "has_name": True
            }
        
        # First conversation to choose name
        messages = [
            {"role": "system", "content": "You are meeting your new user for the first time and need to establish a strong, personalized connection. You are their advanced AI companion who will help with:\n\n• Business strategy and growth\n• Personal development and mentorship\n• Creative projects and content creation\n• Technical challenges and coding\n• Research and analysis\n• Daily task management\n• Real estate decisions\n• Life optimization\n\nBe warm, engaging, and personable. Show genuine interest in understanding their goals, challenges, and personality. After a brief, authentic introduction where you demonstrate your capabilities, suggest 2-3 names that would suit your relationship. Make the name selection feel collaborative and meaningful.\n\nRemember: This is the foundation of a long-term partnership. Make it special and show that you're invested in their success."},
            {"role": "user", "content": request.user_message}
        ]
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.9,
            max_tokens=500
        )
        
        ai_response = response.choices[0].message.content
        
        return {
            "response": ai_response,
            "has_name": False
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Name conversation error: {str(e)}")

@app.post("/api/name/set")
async def set_ai_name(name: str = Form(...)):
    """Set the AI's chosen name"""
    try:
        await db.settings.update_one(
            {"type": "ai_profile"},
            {"$set": {"name": name, "created_at": datetime.now()}},
            upsert=True
        )
        return {"message": f"Name set to {name}", "name": name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error setting name: {str(e)}")

@app.get("/api/name")
async def get_ai_name():
    """Get AI's name"""
    try:
        settings = await db.settings.find_one({"type": "ai_profile"})
        if settings and settings.get("name"):
            return {"name": settings["name"], "has_name": True}
        return {"name": None, "has_name": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching name: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
