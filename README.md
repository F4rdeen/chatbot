# 🌏 Multilingual AI Chatbot

An AI-powered chatbot that speaks **English**, **Bahasa Melayu**, **Tamil (தமிழ்)**, and **Manglish** (a fun mix of all three), complete with **voice synthesis** and **voice input** — all using free APIs.

## Features

- 🤖 **AI Responses** – Powered by HuggingFace Inference API (free tier)
- 🔊 **Text-to-Speech** – Browser Web Speech API with language-aware voices
- 🎙️ **Voice Input** – Speak your message via browser microphone
- 🌐 **4 Languages** – English, Bahasa Melayu, தமிழ் (Tamil), Manglish mix
- 🚀 **Vercel Ready** – Deploy with one click

## Getting Started

### Prerequisites

- Node.js 18+
- A free [HuggingFace account](https://huggingface.co/) (optional but recommended for better rate limits)

### Local Development

```bash
# Install dependencies
npm install

# Copy env file and add your HuggingFace API key
cp .env.example .env.local
# Edit .env.local and add your HUGGINGFACE_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the chatbot.

### Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add `HUGGINGFACE_API_KEY` in Vercel Environment Variables
4. Click Deploy!

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| AI Model | HuggingFace `zephyr-7b-beta` (free) |
| TTS | Web Speech API (browser built-in, free) |
| STT | Web Speech Recognition API (browser built-in, free) |
| Deployment | Vercel |

## Languages Supported

| Language | Code | Voice |
|----------|------|-------|
| English | `en` | `en-US` |
| Bahasa Melayu | `ms` | `ms-MY` |
| Tamil | `ta` | `ta-IN` |
| Manglish Mix | `mix` | `en-US` (with code-switching) |

