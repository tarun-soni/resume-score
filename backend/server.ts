import express from 'express';
// import fileUpload from 'express-fileupload';
// import pdf from 'pdf-parse';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
import { tempJD } from './test_files/temp_jd';
import { test_resume } from './test_files/test_resume';
import { getPrompt } from './prompt';
const app = express();
app.use(express.json());
// app.use(fileUpload());

// Constants
const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

// 🧠 Helper: Create the prompt for LLM
function buildPrompt(jd: string, resumeText: string) {
  return getPrompt(jd, resumeText);
}

app.post('/analyze', async (req: any, res: any) => {
  try {
    // const { jd } = req.body || {};
    // if (!jd || typeof jd !== 'string') {
    //   return res
    //     .status(400)
    //     .json({ error: 'Missing or invalid `jd` in request body' });
    // }

    // const resumeFile = req.files?.resume as fileUpload.UploadedFile | undefined;
    // if (!resumeFile || !resumeFile.data) {
    //   return res.status(400).json({ error: 'Missing `resume` file upload' });
    // }

    const jd = tempJD;

    const parsedPDF = test_resume;

    if (!process.env.OPENROUTER_API_KEY) {
      return res
        .status(500)
        .json({ error: 'OPENROUTER_API_KEY not set in .env' });
    }

    // 🧾 Extract text from resume PDF
    // const parsedPDF = await pdf(resumeFile.data);
    // const resumeText = parsedPDF.text.trim();

    // console.log('✅ Resume text length:', resumeText.length);

    const resumeText = parsedPDF;

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
    });
  } catch (err: any) {
    console.error('❌ Error in /analyze:', err?.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3001, () => console.log('✅ Server running on port 3001'));
