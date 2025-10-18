
-- Schema for storing uploaded resumes
-- Table: resumes
-- Columns:
--  id: integer primary key autoincrement
--  resume_file: blob (raw file bytes)
--  resume_parsed_text: text (extracted plain text from PDF)

CREATE TABLE IF NOT EXISTS resumes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	resume_file BLOB NOT NULL,
	resume_parsed_text TEXT
);
