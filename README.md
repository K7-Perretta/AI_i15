# AI Companion App - Ultimate Personal Assistant

A comprehensive AI-powered personal assistant app designed for iPhone with advanced capabilities for business, real estate, development, and personal growth.

## 🚀 Features

### **Multi-Provider AI Support**
- **OpenAI GPT-4**: Primary provider with GPT-4o and GPT-4o-mini
- **Anthropic Claude**: Advanced reasoning with Claude-3-Opus
- **IBM Watsonx**: Enterprise-grade AI with Llama models
- **AIMLAPI**: Fast and reliable API access
- **Groq**: Ultra-fast inference with Llama models
- **Mistral**: High-performance open-source models
- **Emergent LLM**: Alternative provider for redundancy

### **Core Capabilities**
- **Advanced Chat**: Context-aware conversations with memory
- **Voice Interaction**: Premium ElevenLabs TTS with multiple voices
- **Real Estate Analysis**: Market research, property valuation, investment analysis
- **Business Strategy**: Growth planning, competitive analysis, financial modeling
- **Code Generation**: Production-ready applications and automation scripts
- **Content Creation**: Marketing materials, social media, blog posts
- **Research**: Multi-source intelligence gathering and analysis
- **Personal Development**: Career coaching, life optimization, goal setting
- **Task Automation**: Workflow optimization and productivity enhancement

## 📱 Deployment Guide

### **Prerequisites**
- Node.js 18+
- Python 3.12+
- MongoDB (local or cloud)
- Vercel account (for deployment)

### **1. Backend Setup**

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

**Required Environment Variables:**
```env
# Database
MONGO_URL=mongodb://127.0.0.1:27017/ai_companion

# AI Providers (choose what you want to use)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
IBM_WATSONX_API_KEY=your-ibm-key
AIMLAPI_API_KEY=your-aimlapi-key
GROQ_API_KEY=gsk-your-groq-key
MISTRAL_API_KEY=your-mistral-key
EMERGENT_LLM_KEY=sk-emergent-your-emergent-key

# Research & Tools
PERPLEXITY_API_KEY=pplx-your-perplexity-key
TAVILY_API_KEY=tvly-your-tavily-key

# Voice & Media
ELEVENLABS_API_KEY=sk-your-elevenlabs-key
REPLICATE_API_KEY=r8-your-replicate-key
```

### **2. Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with backend URL
```

**Frontend Environment Variables:**
```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.vercel.app
```

### **3. Vercel Deployment**

#### **Backend Deployment**
1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Settings**:
   - **Framework**: Other
   - **Root Directory**: backend
   - **Build Command**: `pip install -r requirements.txt && python server.py`
   - **Install Command**: `pip install -r requirements.txt`
3. **Environment Variables**: Add all API keys from your `.env` file
4. **Deploy**: Vercel will automatically deploy your backend

#### **Frontend Deployment**
1. **New Project**: Create new Vercel project
2. **Connect Repository**: Link your frontend directory
3. **Configure Settings**:
   - **Framework**: Next.js (Vercel will detect Expo)
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
4. **Environment Variables**:
   - `EXPO_PUBLIC_BACKEND_URL`: Your backend Vercel URL
5. **Deploy**: Vercel will build and deploy your app

### **4. Mobile App Setup**

#### **Expo Development**
```bash
cd frontend

# Install Expo CLI
npm install -g @expo/cli

# Start development server
npx expo start

# For iPhone testing
npx expo start --tunnel
```

#### **Build for Production**
```bash
# Build for iOS
npx expo build:ios

# Or use EAS Build (recommended)
npm install -g @expo/eas-cli
eas build --platform ios
```

## 🔧 Configuration

### **API Key Management**
- Access settings in the app to manage API keys
- Keys are securely masked and stored in database
- Support for 10+ AI providers with automatic fallback

### **Provider Selection**
- Choose AI provider per conversation in chat settings
- Automatic fallback if preferred provider fails
- Performance optimization based on task type

## 📊 Usage

### **Getting Started**
1. **Onboarding**: AI chooses its name and establishes relationship
2. **API Setup**: Configure your preferred AI providers
3. **Provider Selection**: Choose AI model for each conversation
4. **Explore Tools**: Use specialized tools for different tasks

### **Available Tools**
- **Chat**: General conversation with context memory
- **Voice**: Voice interaction with premium TTS
- **Tools**: Specialized AI capabilities
  - Image Generation (DALL-E)
  - Code Generation
  - Research & Analysis
  - Document Processing
  - Real Estate Analysis
  - Business Strategy
  - Personal Development
  - Task Automation
- **Marketing**: Content creation and campaign planning
- **History**: Conversation management and search

## 🛠️ Architecture

### **Backend (FastAPI)**
- RESTful API with async support
- MongoDB for data persistence
- Multi-provider AI integration
- Automatic fallback and error handling
- Secure API key management

### **Frontend (React Native/Expo)**
- Cross-platform mobile app
- Optimized for iPhone
- Offline-capable with caching
- Real-time voice interaction
- Intuitive UI/UX design

### **Database (MongoDB)**
- Conversation history
- User preferences
- API key storage
- Analytics and usage data

## 🔒 Security

- API keys encrypted and masked
- Secure environment variable management
- No sensitive data in client-side storage
- HTTPS-only communication
- Input validation and sanitization

## 🚀 Performance

- Optimized for mobile devices
- Lazy loading and code splitting
- Efficient caching strategies
- Background processing for heavy tasks
- Minimal bundle size

## 📈 Monitoring & Analytics

- Usage tracking and analytics
- Error monitoring and reporting
- Performance metrics
- User behavior insights

## 🆘 Troubleshooting

### **Common Issues**

**Backend Connection Issues:**
```bash
# Check if backend is running
curl https://your-backend-url.vercel.app/api/health
```

**API Key Problems:**
- Verify keys in Vercel environment variables
- Check key format and validity
- Ensure provider-specific requirements

**Mobile App Issues:**
```bash
# Clear cache and restart
npx expo start --clear
```

**Database Connection:**
- Verify MongoDB connection string
- Check network connectivity
- Ensure database permissions

## 📝 API Documentation

### **Endpoints**
- `GET /api/health` - Health check
- `POST /api/chat` - Main chat endpoint
- `POST /api/voice/transcribe` - Audio transcription
- `POST /api/voice/speak` - Text-to-speech
- `POST /api/image/generate` - Image generation
- `POST /api/document/analyze` - Document analysis
- `POST /api/research` - Research and analysis
- `POST /api/code` - Code generation
- `POST /api/marketing` - Marketing content
- `POST /api/real-estate/analyze` - Real estate analysis
- `POST /api/business/strategy` - Business strategy
- `POST /api/personal/development` - Personal development
- `POST /api/task/automation` - Task automation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with FastAPI, React Native, and Expo
- Powered by multiple AI providers
- Designed for productivity and personal growth

---

**Ready to deploy your ultimate AI companion? Follow the deployment guide above and start building the future of personal assistance!**
