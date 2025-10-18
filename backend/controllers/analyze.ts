import axios from 'axios';
import { getPrompt } from '../prompt';
import { tempJD } from '../test_files/temp_jd';
import { test_resume } from '../test_files/test_resume';
import fs from 'fs';
const { PDFParse } = require('pdf-parse');
const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

// 🧠 Helper: Create the prompt for LLM
function buildPrompt(jd: string, resumeText: string) {
  return getPrompt(jd, resumeText);
}
export const analyzeController = async (req: any, res: any) => {
  try {
    const { jd } = req.body || {};
    if (!jd || typeof jd !== 'string') {
      return res
        .status(400)
        .json({ error: 'Missing or invalid `jd` in request body' });
    }

    const resumeFile = req.file;
    if (!resumeFile) {
      return res.status(400).json({ error: 'Missing `resume` file upload' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res
        .status(500)
        .json({ error: 'OPENROUTER_API_KEY not set in .env' });
    }

    // 🧾 Extract text from resume PDF with timeout
    const dataBuffer = fs.readFileSync(resumeFile.path);

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

    console.log('✅ Resume text length:', resumeText.length);

    // Clean up the uploaded file
    fs.unlinkSync(resumeFile.path);

    const prompt = buildPrompt(jd, resumeText);

    console.log('prompt', prompt);

    // 🧠 Call OpenRouter
    const response = await axios.post(
      OPENROUTER_API,
      {
        // model: 'meta-llama/llama-3.1-8b-instruct', // free, reliable model
        model: 'openai/gpt-oss-20b:free',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Resume JD Evaluator',
        },
      }
    );

    const message = response?.data?.choices?.[0]?.message;
    if (!message) {
      return res
        .status(502)
        .json({ error: 'Unexpected response from OpenRouter' });
    }

    res.json({
      model: response.data.model,
      analysis: message.content,
      resumeText: resumeText,
      numPages: result.numpages,
    });
  } catch (err: any) {
    console.error('❌ Error in /analyze:', err?.message || err);
    // Clean up the uploaded file even if processing fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
