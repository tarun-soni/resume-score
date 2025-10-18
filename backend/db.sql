
-- Schema for storing uploaded resumes
-- Table: resumes
-- Columns:
--  id: TEXT primary key (UUID)
--  identifier: text (user-friendly name like resume_1, resume_2, etc.)
--  resume_file: blob (raw file bytes)
--  resume_parsed_text: text (extracted plain text from PDF)
--  created_at: text (ISO timestamp)

CREATE TABLE IF NOT EXISTS resumes (
	id TEXT PRIMARY KEY,
	identifier TEXT NOT NULL UNIQUE,
	resume_file BLOB NOT NULL,
	resume_parsed_text TEXT,
	created_at TEXT NOT NULL
);

-- Table: jds (job descriptions)
-- Columns:
--  id: TEXT primary key (UUID)
--  company_name: text
--  jd_text: text (the actual job description)
--  created_at: text (ISO timestamp)

CREATE TABLE IF NOT EXISTS jds (
	id TEXT PRIMARY KEY,
	company_name TEXT NOT NULL,
	jd_text TEXT NOT NULL,
	created_at TEXT NOT NULL
);

-- Table: analysis
-- Columns:
--  id: TEXT primary key (UUID)
--  resume_id: text (foreign key to resumes.id)
--  jd_id: text (foreign key to jds.id)
--  analysis: text (JSON string with full analysis)
--  overall_score: integer (0-100 for easy sorting)
--  created_at: text (ISO timestamp)

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
