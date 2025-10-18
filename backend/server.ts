import express from 'express';
// pdf-parse exports a CommonJS function; import via require to call it
const { PDFParse } = require('pdf-parse');
import dotenv from 'dotenv';
dotenv.config();
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { analyzeController } from './controllers/analyze';
const app = express();

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

    console.log('db :>> ', db);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resume_file BLOB NOT NULL,
        resume_parsed_text TEXT
      );
    `);
    // persist initial DB
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

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

// Constants

app.post('/analyze', upload.single('resume'), analyzeController);

// server listen moved to DB init completion

app.post(
  '/upload',
  upload.single('resumeFile'),
  async function (req, res, next) {
    const { fileNameByUser } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!fileNameByUser || typeof fileNameByUser !== 'string') {
      return res.status(400).json({
        error: 'fileNameByUser parameter is required and must be a string',
      });
    }

    try {
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

      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);

      console.log('result', result);
      console.log('fileNameByUser', fileNameByUser);

      res.json({
        file: req.file,
        fileNameByUser: fileNameByUser,
        parsedText: result.text,
        numPages: result.numpages,
        info: result.info,
      });
    } catch (error) {
      console.error('Error parsing PDF:', error);
      // Clean up the uploaded file even if parsing fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // Check if it's a timeout error
      if (error.message.includes('timeout')) {
        res.status(408).json({ error: 'PDF parsing timeout after 30 seconds' });
      } else {
        res.status(500).json({ error: 'Failed to parse PDF' });
      }
    }
  }
);

app.get('/', async (req: any, res: any) => {
  console.log('Server running');
  res.json({ message: 'Server is running' });
});
