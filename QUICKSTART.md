# Quick Start Guide

## First Time Setup

### 1. Install Dependencies

Backend:
```bash
cd backend
bun install
```

Frontend:
```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `backend/.env`:
```bash
cd backend
echo "OPENROUTER_API_KEY=your_key_here" > .env
```

Get your free OpenRouter API key at: https://openrouter.ai/

### 3. Start the Application

**Option A: Use the startup script (recommended)**
```bash
./start-dev.sh
```

**Option B: Start manually**

Terminal 1 (Backend):
```bash
cd backend
bun run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 4. Open the App

Navigate to: http://localhost:3000

## How to Use

### Step 1: Upload Your Resumes
1. Have your 5 resume PDFs ready (different versions optimized for ATS)
2. Click "Upload Resumes (Max 5)" section
3. Select your PDF files
4. Click "Upload Resumes" button
5. Wait for upload confirmation

### Step 2: Prepare Job Description
1. Copy the job description from the posting
2. Paste it in the "Job Description" text area
3. Optionally add the company name

### Step 3: Rank Your Resumes
1. Click "Rank Resumes" button
2. Wait for analysis (takes ~30-60 seconds per resume)
3. View ranked results

### Step 4: Review Results
- Resumes are ranked from best to worst
- Top resume gets 🏆 BEST badge
- Click any resume to see detailed analysis
- Review scores for:
  - Skill Match
  - Experience Relevance
  - Keyword Match
  - ATS Friendliness
  - Achievements Impact
  - Cultural & Role Fit

### Step 5: Improve Your Resume
- Review "Top Suggestions" for each resume
- See what keywords are missing
- Understand what improvements would increase your score

## Tips

1. **Resume Naming**: Resumes are automatically named with timestamps. You'll see names like `resume_1729275840123_1`

2. **Managing Resumes**: You can delete old resumes using the "Delete" button next to each resume

3. **Multiple Job Descriptions**: You can analyze the same set of resumes against different JDs

4. **Analysis Storage**: All analyses are saved to the database for future reference

5. **Best Practices**:
   - Use PDF format only
   - Ensure PDFs are text-based (not scanned images)
   - Keep file sizes reasonable (under 5MB each)

## Troubleshooting

### Backend won't start
- Check if `backend/.env` exists and has valid `OPENROUTER_API_KEY`
- Ensure port 3001 is not already in use
- Check backend terminal for error messages

### Frontend won't start
- Ensure port 3000 is not already in use
- Try `cd frontend && rm -rf .next && npm run dev`

### Upload fails
- Ensure backend is running on port 3001
- Check if PDF is valid and text-based
- Check backend terminal for errors

### Analysis takes too long
- Each resume takes 30-60 seconds to analyze
- For 5 resumes, expect 2.5-5 minutes total
- This is normal for free tier API usage

### Can't see detailed analysis
- Click on the resume card in the results section
- Scroll down to see detailed breakdown
- If analysis shows "raw" field, the AI response may not have been proper JSON

## Need Help?

Check the main README.md for more detailed documentation and API endpoints.
