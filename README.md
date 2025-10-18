# Resume Comparison Tool

A full-stack application to compare multiple resumes against job descriptions using AI analysis. Upload your resume variations, paste a job description, and get ranked results showing which resume performs best for that specific role.

## Features

- Upload up to 5 resume PDFs
- Store resumes in local SQLite database
- Paste job descriptions with company name
- Batch analysis of all resumes against the JD using OpenRouter API
- Ranked results with detailed scoring breakdowns
- View detailed analysis for each resume including:
  - Skill Match (25%)
  - Experience Relevance (20%)
  - Keyword Match (15%)
  - ATS Friendliness (10%)
  - Achievements Impact (20%)
  - Cultural & Role Fit (10%)

## Architecture

- **Backend**: Express + TypeScript + SQLite (sql.js)
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **AI**: OpenRouter API with free models

## Setup

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm
- OpenRouter API key (free tier available)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
bun install
```

3. Create `.env` file:
```bash
OPENROUTER_API_KEY=your_key_here
```

4. Start the backend server (port 3001):
```bash
bun run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server (port 3000):
```bash
npm run dev
```

## Usage

1. **Start both servers**:
   - Backend: `cd backend && bun run dev` (port 3001)
   - Frontend: `cd frontend && npm run dev` (port 3000)

2. **Open the app**: Navigate to `http://localhost:3000`

3. **Upload your resumes**:
   - Click "Upload Resumes (Max 5)"
   - Select up to 5 PDF resumes
   - Click "Upload Resumes"

4. **Analyze against a JD**:
   - Enter company name (optional)
   - Paste the job description
   - Click "Rank Resumes"

5. **View results**:
   - See ranked resumes from best to worst
   - Click on any resume to view detailed analysis
   - First place gets 🏆 BEST badge

## API Endpoints

### Backend (port 3001)

- `GET /` - Health check
- `GET /resumes` - Get all stored resumes
- `POST /resumes` - Upload a new resume (multipart/form-data)
- `DELETE /resumes/:id` - Delete a resume
- `POST /jds` - Store a job description
- `POST /analyze-batch` - Analyze all resumes against a JD
- `GET /analysis/:jd_id` - Get analysis results for a specific JD

## Database Schema

### resumes
- `id` (TEXT, primary key)
- `identifier` (TEXT, unique)
- `resume_file` (BLOB)
- `resume_parsed_text` (TEXT)
- `created_at` (TEXT)

### jds
- `id` (TEXT, primary key)
- `company_name` (TEXT)
- `jd_text` (TEXT)
- `created_at` (TEXT)

### analysis
- `id` (TEXT, primary key)
- `resume_id` (TEXT, foreign key)
- `jd_id` (TEXT, foreign key)
- `analysis` (TEXT, JSON)
- `overall_score` (INTEGER)
- `created_at` (TEXT)

## Tech Stack

- **Backend**:
  - Express 5.x
  - TypeScript
  - sql.js (SQLite WASM)
  - Multer (file uploads)
  - pdf-parse (PDF text extraction)
  - axios (HTTP client)

- **Frontend**:
  - Next.js 15
  - React 19
  - TypeScript
  - Tailwind CSS

## Notes

- Analysis takes time as it processes each resume sequentially through the AI
- Results are stored in the database for future reference
- Free OpenRouter models are used by default
- All data is stored locally in `data/resumes.db`
