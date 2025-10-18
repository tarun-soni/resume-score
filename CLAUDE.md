# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A resume evaluation service that analyzes resumes against job descriptions using LLMs. The backend accepts PDF resume uploads and job descriptions, extracts text, generates structured analysis via OpenRouter API, and returns scoring across multiple dimensions (skill match, experience relevance, keyword match, etc.).

## Commands

### Development (from `/backend` directory)

**Note: This project uses Bun, not npm.**

```bash
# Install dependencies
bun install

# Start server (port 3001)
bun run start

# Development with auto-reload
bun run dev

# Alternative with nodemon
bun run nodemon
```

### Environment Setup

Create `backend/.env` with:
```
OPENROUTER_API_KEY=<your-key>
```

## Architecture

### Backend Structure (`backend/`)

- **`server.ts`**: Express server entry point
  - Initializes SQLite database using sql.js (WASM-based)
  - Configures Multer for file uploads to `./myUploads`
  - Listens on port **3001** (critical for client compatibility)
  - Routes:
    - `POST /upload`: Accepts PDF, parses with pdf-parse, returns extracted text
    - `POST /analyze`: Accepts JD + resume file, calls OpenRouter for analysis
    - `GET /`: Health check

- **`controllers/analyze.ts`**: Main analysis logic
  - Extracts text from uploaded PDF resume
  - Builds prompt via `getPrompt(jd, resumeText)`
  - Calls OpenRouter API with model `openai/gpt-oss-20b:free`
  - Returns structured JSON analysis with scores and improvement suggestions

- **`prompt.ts`**: LLM prompt template
  - `getPrompt(jd, resumeText)`: Returns detailed scoring prompt
  - Scoring categories: Skill Match (25%), Experience Relevance (20%), Keyword Match (15%), ATS Friendliness (10%), Achievements Impact (20%), Cultural & Role Fit (10%)
  - Output format enforces strict JSON with evidence, improvement plans, and expected gains

- **`types.ts`**: Type definitions
  - Currently minimal: `PromptFunction` type

### Database

- **SQLite** via sql.js (in-memory WASM with disk persistence)
- Located at `data/resumes.db`
- Schema in `backend/db.sql`:
  - `resumes` table: `id`, `resume_file` (BLOB), `resume_parsed_text` (TEXT)
  - Note: Current implementation doesn't fully utilize DB storage yet (per TODO.md roadmap)

### Key Dependencies

- **Express 5.x**: Web server
- **Multer**: Multipart file upload handling
- **pdf-parse**: PDF text extraction
- **axios**: HTTP client for OpenRouter API
- **sql.js**: SQLite WASM database
- **TypeScript**: Compiled with ts-node

## Development Patterns

### File Uploads

- Uses Multer disk storage pattern (see `server.ts:15-26`)
- Files temporarily saved to `./myUploads` with timestamp prefix
- Always clean up uploaded files after processing (see `fs.unlinkSync` calls)

### API Integration

- OpenRouter API expects:
  - Headers: `Authorization`, `HTTP-Referer`, `X-Title`
  - Body: `model`, `messages` array
- Response shape: `response.data.choices[0].message.content`

### Prompt Engineering

- Prompts are plain text templates (no function calling)
- Follow strict JSON output requirements
- Include evidence-based scoring with direct quotes
- Provide actionable improvement suggestions with expected score gains

## Roadmap (from TODO.md)

Future enhancements planned:
1. Store parsed resumes in DB with unique identifiers
2. Add JD upload/storage functionality
3. Create analysis table linking resumes ↔ JDs ↔ analysis results
4. Enable batch analysis across multiple resume-JD pairs

## Important Constraints

- **Port 3001**: Server must run on this port for client compatibility
- **TypeScript**: Code runs directly via ts-node (no compilation step)
- **File cleanup**: Always delete uploaded files after processing to prevent disk bloat
- **API keys**: Never commit `.env` files or API keys
- **Error handling**: Validate `jd` field and resume file existence before processing
