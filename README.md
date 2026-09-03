<h1 align="center">
  <br>
  <a href="https://github.com/ryan1337c/Omni">
    <img src="https://raw.githubusercontent.com/ryan1337c/Omni/master/assets/omni-logo.png" alt="Omni" width="200">
  </a>
  <br>
  Omni
  <br>
</h1>

<h4 align="center">Meet Omni — an all-in-one copilot that can help you with everyday tasks like conversations, decision-making, coding, and image generation.</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#credits">Credits</a> •
  <a href="#website-link">Website Link</a> •
  <a href="#license">License</a>
</p>

## Key Features

* Multi-Model AI Chat
  - Chat with multiple large language models and select the best model for each task.
  - Get help with questions, brainstorming, writing, decision-making, and more.
* Image Generation
  - Create high-quality images from natural-language descriptions.
* Resume Tailoring
  - Optimize a resume for a specific role by matching it to the job description.
* Quiz Generation
  - Automatically generate custom quizzes from uploaded documents.
  - Create questions manually for greater control.
* Flashcard Generation
  - Generate AI-powered flashcards for studying and review.
  - Create and organize flashcards manually.
* File Analysis
  - Upload documents for the AI to analyze, summarize, or transform.
* AI-Assisted Coding
  - Get coding guidance, suggested solutions, and help debugging errors.
* Conversation History
  - Save and revisit previous conversations with Omni.
* User Accounts
  - Securely register, sign in, and manage personalized AI sessions.

## Installation

### Prerequisites

Before getting started, ensure you have:

- [Node.js](https://nodejs.org/) installed
- npm
- A [Supabase](https://supabase.com/) project
- OpenAI and/or DeepSeek API keys
- An [Anthropic](https://console.anthropic.com/) API key (resume tailoring)
- A pdflatex compile host, or a local TeX Live / MiKTeX install (see below)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/ryan1337c/Omni.git
   cd Omni
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   OPENAI_API_KEY=your_openai_api_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key

   LATEX_COMPILE_URL=http://localhost:8080
   # Optional: skip the HTTP compile service and spawn local pdflatex instead
   # LATEX_BIN=pdflatex

   CLIENT_ID=your_google_oauth_client_id
   CLIENT_SECRET=your_google_oauth_client_secret

   EMAIL_FROM=your_email_address
   EMAIL_APP_PASSWORD=your_email_app_password
   ```

   Google OAuth and email credentials are only required for their corresponding features.

   Resume tailoring calls Claude Sonnet 5, then compiles Jake’s Resume LaTeX with pdflatex. Vercel serverless cannot ship TeX Live, so production must set `LATEX_COMPILE_URL` to a [latex-on-http](https://github.com/YtoTech/latex-on-http) compatible host (origin is enough; the app appends `/builds/sync`). Locally you can run that container and point `LATEX_COMPILE_URL` at `http://localhost:8080`, or set `LATEX_BIN` to a `pdflatex` binary instead.

   Resume content is PII. A public compile host sees the full document, so do not use a shared/public latex-on-http instance in production. Run a small TeX Live container you control and set `LATEX_COMPILE_URL` to that host.

   > **Important:** Never commit your `.env.local` file or expose secret API keys publicly.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Create and run an optimized production build:

```bash
npm run build
npm start
```

## How to Use

1. Create an account or sign in.
2. Choose an AI model for your task.
3. Enter a prompt or upload a supported document.
4. Use Omni to chat, generate images, tailor resumes, create quizzes and flashcards, or get coding assistance.
5. Access previous conversations from your chat history.

## Credits
Developed by [Ryan Chen](https://github.com/ryan1337c).
### APIs and AI Models
- [OpenAI](https://openai.com/)
  - GPT-4o Mini — general chat and file analysis
  - GPT-5.1 — quiz and flashcard generation
  - DALL·E 3 — image generation
- [DeepSeek](https://www.deepseek.com/)
  - DeepSeek Chat — general chat and reasoning
- [Anthropic](https://www.anthropic.com/claude/sonnet)
  - Claude Sonnet 5 — resume tailoring (Jake’s Resume LaTeX)
### Technologies
Built with Next.js, React, Tailwind CSS, and Supabase.

## Website Link
https://omni-7y2c.vercel.app/ 

## License
Copyright © 2026 Ryan Chen. All rights reserved.
This project is not currently licensed for copying, modification, or distribution.
