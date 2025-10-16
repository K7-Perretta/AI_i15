# AI Companion PWA — Production Build & Run Guide

This repository contains a FastAPI backend and a React (Create React App) Progressive Web App (PWA) frontend. This guide focuses on running the PWA in production without an Apple developer account.

- Backend: FastAPI + MongoDB
- Frontend: CRA-based PWA with service worker enabled and web manifest

## Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- MongoDB (local or cloud)

## One-time setup

1) Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

2) Install frontend dependencies:

```bash
npm --prefix web-app ci
```

3) Configure environment variables

Create and fill your backend .env:

```env
# backend/.env
MONGO_URL=mongodb://127.0.0.1:27017/ai_companion
SECRET_KEY=change-me
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
IBM_WATSONX_API_KEY=...
AIMLAPI_API_KEY=...
GROQ_API_KEY=...
MISTRAL_API_KEY=...
EMERGENT_LLM_KEY=...
PERPLEXITY_API_KEY=...
TAVILY_API_KEY=...
ELEVENLABS_API_KEY=...
REPLICATE_API_KEY=...
```

Create and fill your frontend .env (used at build time):

```env
# web-app/.env
REACT_APP_BACKEND_URL=https://your-backend-hostname:8001
```

Notes:
- In GitHub Codespaces the frontend auto-maps to the backend via web-app/src/config.ts; you can keep REACT_APP_BACKEND_URL empty for Codespaces use.
- For production builds on your own domain, set REACT_APP_BACKEND_URL to your backend’s public HTTPS URL before building.

## Production run (local)

Use two terminals.

Terminal A — start the API:

```bash
npm run api:start
```

Terminal B — build and serve the PWA:

```bash
npm run pwa:build
npm run pwa:serve
```

This serves the optimized PWA from web-app/build at http://localhost:3000

End-to-end check:
- Open http://localhost:3000
- The app should fetch API routes from REACT_APP_BACKEND_URL
- Visit http://localhost:8001/api/health to verify backend health

## What the commands do

- npm run api:start — runs FastAPI via uvicorn on port 8001
- npm run pwa:build — builds web-app into web-app/build with relative asset paths (homepage set to ".")
- npm run pwa:serve — serves the static build over http://localhost:3000 using npx serve

You can also run the frontend-only scripts inside the web-app folder:

```bash
npm --prefix web-app run build
npm --prefix web-app run serve
```

## Development workflow (optional)

- Start API in reload mode:

```bash
npm run api:dev
```

- Start CRA dev server (hot reload + proxy to API):

```bash
cd web-app
npm start
```

The CRA proxy (web-app/package.json "proxy") forwards /api/* to http://localhost:8001 in development.

## PWA details

- Service worker is registered in production by default:
  - See web-app/src/index.tsx and web-app/src/serviceWorkerRegistration.ts
- The PWA manifest is at web-app/public/manifest.json
- For install prompts and offline caching you must serve over HTTPS in production

## Deploying the PWA

Any static host will work (Netlify, Vercel static, S3/CloudFront, Nginx):

```bash
npm run pwa:build
# upload the contents of web-app/build to your static host
```

Backend can be deployed anywhere that supports FastAPI/uvicorn (e.g., Fly.io, Railway, Render, VM with Docker). Ensure the public URL is placed into REACT_APP_BACKEND_URL before building the PWA.

## Common troubleshooting

- White screen after deploy:
  - Ensure web-app/package.json has "homepage": "." so asset paths are relative
- API 404s from the PWA:
  - Confirm REACT_APP_BACKEND_URL was set at build time and points to the correct HTTPS URL
- PWA install prompt not shown:
  - Serve over HTTPS and interact with the site for a bit; prompt criteria vary by browser

## Original feature overview

- Multi-provider LLM support with fallback
- Chat, Voice, Document processing, Image generation, Research tools
- MongoDB persistence for conversations and settings

## Security

- Keep your API keys in backend/.env or your server’s secret store
- Do not expose secrets in the frontend .env (only REACT_APP_* are inlined at build time)
- Use HTTPS between PWA and backend in production

## License

MIT
