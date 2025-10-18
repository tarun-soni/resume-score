import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import axios from 'axios';
import { analyzeController } from './controllers/analyze';
import { getPrompt } from './prompt';

// pdf-parse exports PDFParse class as a named export
const { PDFParse } = require('pdf-parse');

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const app = express();

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './myUploads');
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random());
    return cb(null, uniqueSuffix + `${file.originalname}`);
  },
});

const upload = multer({ storage });
// Initialize or open SQLite DB at backend/data/resumes.db (using sql.js in-memory WASM)
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'resumes.db');

// sql.js Database instance (will be set in async init below)
let SQL: any = null;
let db: any = null;

async function initDatabase() {
  SQL = await initSqlJs({});

  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(new Uint8Array(filebuffer));

    console.log('db loaded successfully');
  } else {
    db = new SQL.Database();
    // Create all tables
    db.run(`
      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL UNIQUE,
        resume_file BLOB NOT NULL,
        resume_parsed_text TEXT,
        created_at TEXT NOT NULL
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS jds (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        jd_text TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS analysis (
        id TEXT PRIMARY KEY,
        resume_id TEXT NOT NULL,
        jd_id TEXT NOT NULL,
        analysis TEXT NOT NULL,
        overall_score INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (resume_id) REFERENCES resumes(id),
        FOREIGN KEY (jd_id) REFERENCES jds(id)
      );
    `);
    // persist initial DB
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

// Helper function to save DB to disk
function saveDatabase() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Export db for use in controllers
export { db, saveDatabase, generateUUID };

// Initialize DB and start the server after DB is ready
(async () => {
  try {
    await initDatabase();
    app.listen(3001, () => console.log('✅ Server running on port 3001'));
  } catch (err) {
    console.error('Failed to initialize DB or start server:', err);
    process.exit(1);
  }
})();

// Routes

app.get('/', async (req: any, res: any) => {
  console.log('Server running');
  res.json({ message: 'Server is running' });
});

// POST /resumes - Upload and store resume
app.post('/resumes', upload.single('resume'), async (req: any, res: any) => {
  try {
    const { identifier } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ error: 'identifier is required' });
    }

    // Read the uploaded file buffer
    const dataBuffer = fs.readFileSync(req.file.path);

    // Parse the PDF with timeout
    const parser = new PDFParse({ data: dataBuffer });

    // Create a timeout promise that rejects after 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('PDF parsing timeout after 30 seconds'));
      }, 30000);
    });

    // Race between parsing and timeout
    const result = await Promise.race([parser.getText(), timeoutPromise]);

    // Clean up the parser
    await parser.destroy();

    const resumeText = result.text.trim();

    // Store in database
    const id = generateUUID();
    const createdAt = new Date().toISOString();

    db.run(
      'INSERT INTO resumes (id, identifier, resume_file, resume_parsed_text, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, identifier, dataBuffer, resumeText, createdAt]
    );
    saveDatabase();

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      id,
      identifier,
      parsedTextLength: resumeText.length,
      numPages: result.numpages,
      message: 'Resume uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Check if it's a timeout error
    if (error.message.includes('timeout')) {
      return res.status(408).json({ error: 'PDF parsing timeout after 30 seconds' });
    }

    res.status(500).json({ error: error.message || 'Failed to upload resume' });
  }
});

// GET /resumes - Get all stored resumes
app.get('/resumes', async (req: any, res: any) => {
  try {
    const result = db.exec('SELECT id, identifier, created_at FROM resumes ORDER BY created_at DESC');

    if (result.length === 0) {
      return res.json([]);
    }

    const rows = result[0].values.map((row: any[]) => ({
      id: row[0],
      identifier: row[1],
      created_at: row[2],
    }));

    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// DELETE /resumes/:id - Delete a resume
app.delete('/resumes/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    db.run('DELETE FROM resumes WHERE id = ?', [id]);
    saveDatabase();
    res.json({ message: 'Resume deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// POST /jds - Store job description
app.post('/jds', async (req: any, res: any) => {
  try {
    const { company_name, jd_text } = req.body;

    if (!company_name || !jd_text) {
      return res.status(400).json({ error: 'company_name and jd_text are required' });
    }

    const id = generateUUID();
    const createdAt = new Date().toISOString();

    db.run(
      'INSERT INTO jds (id, company_name, jd_text, created_at) VALUES (?, ?, ?, ?)',
      [id, company_name, jd_text, createdAt]
    );
    saveDatabase();

    res.json({ id, company_name, message: 'Job description stored successfully' });
  } catch (error: any) {
    console.error('Error storing JD:', error);
    res.status(500).json({ error: 'Failed to store job description' });
  }
});

// POST /analyze-batch - Analyze all resumes against a JD
app.post('/analyze-batch', async (req: any, res: any) => {
  try {
    const { jd_id, jd_text, company_name } = req.body;

    if (!jd_text) {
      return res.status(400).json({ error: 'jd_text is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not set in .env' });
    }

    // Store JD if not already stored
    let actualJdId = jd_id;
    if (!actualJdId) {
      actualJdId = generateUUID();
      const createdAt = new Date().toISOString();
      db.run(
        'INSERT INTO jds (id, company_name, jd_text, created_at) VALUES (?, ?, ?, ?)',
        [actualJdId, company_name || 'Unknown', jd_text, createdAt]
      );
      saveDatabase();
    }

    // Get all resumes
    const resumesResult = db.exec('SELECT id, identifier, resume_parsed_text FROM resumes');

    if (resumesResult.length === 0 || resumesResult[0].values.length === 0) {
      return res.status(400).json({ error: 'No resumes found in database' });
    }

    const resumes = resumesResult[0].values.map((row: any[]) => ({
      id: row[0],
      identifier: row[1],
      parsed_text: row[2],
    }));

    // Analyze each resume
    const results = [];

    for (const resume of resumes) {
      try {
        console.log(`\n📝 Analyzing resume: ${resume.identifier}`);
        const prompt = getPrompt(jd_text, resume.parsed_text);

        console.log(`🚀 Sending request to OpenRouter for ${resume.identifier}...`);
        const response = await axios.post(
          OPENROUTER_API,
          {
            model: 'openai/gpt-oss-20b:free',
            messages: [{ role: 'user', content: prompt }],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'Resume Comparator',
            },
          }
        );

        const message = response?.data?.choices?.[0]?.message;
        if (!message) {
          throw new Error('Unexpected response from OpenRouter');
        }

        const analysisText = message.content;
        console.log(`✅ Received response for ${resume.identifier}, length: ${analysisText.length}`);

        let analysisJson;
        try {
          analysisJson = JSON.parse(analysisText);
          console.log(`✅ Parsed JSON successfully for ${resume.identifier}`);
        } catch (e) {
          console.warn(`⚠️  Failed to parse JSON for ${resume.identifier}, storing as raw`);
          analysisJson = { raw: analysisText, 'Overall Score': 0 };
        }

        const overallScore = analysisJson['Overall Score'] || 0;
        console.log(`📊 Overall Score for ${resume.identifier}: ${overallScore}`);

        // Store analysis in database
        const analysisId = generateUUID();
        const createdAt = new Date().toISOString();

        db.run(
          'INSERT INTO analysis (id, resume_id, jd_id, analysis, overall_score, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [analysisId, resume.id, actualJdId, analysisText, overallScore, createdAt]
        );

        results.push({
          resume_id: resume.id,
          identifier: resume.identifier,
          overall_score: overallScore,
          analysis: analysisJson,
        });
      } catch (err: any) {
        console.error(`❌ Error analyzing resume ${resume.identifier}:`, err.message);
        if (err.response) {
          console.error('Response error:', err.response.status, err.response.data);
        }
        results.push({
          resume_id: resume.id,
          identifier: resume.identifier,
          overall_score: 0,
          error: err.message,
        });
      }
    }

    saveDatabase();

    // Sort by overall score descending
    results.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));

    res.json({
      jd_id: actualJdId,
      total_analyzed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Error in batch analysis:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze resumes' });
  }
});

// GET /analysis/:jd_id - Get analysis results for a specific JD
app.get('/analysis/:jd_id', async (req: any, res: any) => {
  try {
    const { jd_id } = req.params;

    const result = db.exec(
      `SELECT a.id, a.resume_id, r.identifier, a.analysis, a.overall_score, a.created_at
       FROM analysis a
       JOIN resumes r ON a.resume_id = r.id
       WHERE a.jd_id = ?
       ORDER BY a.overall_score DESC`,
      [jd_id]
    );

    if (result.length === 0) {
      return res.json([]);
    }

    const rows = result[0].values.map((row: any[]) => ({
      id: row[0],
      resume_id: row[1],
      identifier: row[2],
      analysis: JSON.parse(row[3]),
      overall_score: row[4],
      created_at: row[5],
    }));

    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});
