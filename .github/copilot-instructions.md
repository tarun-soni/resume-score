# Copilot / AI Agent Instructions for resume-score

Purpose

- Help AI agents make targeted, low-risk code changes in this small backend service that evaluates resumes against job descriptions.

Quick architecture

- Minimal Express backend in `backend/server.ts` that exposes POST /analyze.
  - Accepts JSON body `jd` and a multipart `resume` file upload.
  - Uses `pdf-parse` to extract text from uploaded PDF resumes.
  - Builds a prompt via `getPrompt` in `backend/prompt.ts` and sends it to OpenRouter API.
  - Response is proxied back to the client as JSON.
- Types in `backend/types.ts` (small, single type `PromptFunction`).
- Dependencies are listed in `backend/package.json` (Express v5, axios, dotenv, pdf-parse, express-fileupload).

What to preserve and why

- The server runs on port 3001 (see `app.listen`) — tests and local clients expect this.
- The OpenRouter call includes custom headers `HTTP-Referer` and `X-Title` — preserve unless updating integration notes.
- Prompt shape in `backend/prompt.ts` is intentionally plain text; keep format unless changing the model or adding function-calling.

Common change patterns you'll see

- Small, focused edits to `getPrompt` to tweak scoring criteria or output format.
  - Example: add an extra "Education Match" score — update `PromptFunction` usage and tests.
- Replacing OpenRouter model or provider — update `OPENROUTER_API` usage and env var `OPENROUTER_API_KEY` handling in `backend/server.ts`.
- Adding input validation for `jd` or checking `req.files?.resume` before calling `pdfParse`.

Developer workflows & commands

- Install and run backend (from `backend/`):
  - npm install
  - npm run start (project uses TypeScript files directly; the entry `main` is `server.ts` so run with ts-node or compile first if added)
- Environment:
  - Create a `.env` with `OPENROUTER_API_KEY=<key>` to allow external model calls.

Project-specific conventions

- Keep prompts in `backend/prompt.ts` as single template-returning functions (type `PromptFunction`).
- Network calls use `axios` and expect `response.data.choices[0].message` shape from OpenRouter.
- No framework for tests present; add lightweight unit tests near modified modules if adding behavior.

Integration points & secrets

- External: OpenRouter API at `https://openrouter.ai/api/v1/chat/completions`.
- Local env var: `OPENROUTER_API_KEY` must be set for API calls.

Safety & low-risk edit guidance

- Avoid committing real API keys.
- When changing prompt wording, prefer small iterations and manual review by running `/analyze` locally with sample PDF.
- Add null-checks before `pdfParse(resumeFile.data)` to avoid runtime crashes.

Files to inspect for typical tasks

- backend/server.ts — main HTTP entry, file upload, and OpenRouter integration.
- backend/prompt.ts — prompt template; common change target.
- backend/types.ts — small type definitions.
- backend/package.json — dependencies; update when adding packages.

If you need more

- Ask for preferred test framework and whether TypeScript should be compiled using tsc or run with ts-node.

Please review this and tell me if you want more detail (examples of safe prompt edits, sample curl requests, or suggested unit tests).

- IMPORTANT - USE bun instead of npm

- follow this rule for upload file thing - https://www.loginradius.com/blog/engineering/upload-files-with-node-and-multer
