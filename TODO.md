JD = job description

1. upload pdf
2. parse that pdf
3. store parsed text and attach to unique_id and store in db

- for eg - resume_1 -> parsed_text
  {
  id:UUID,
  identifier: resume_1
  parsed_text: parsed_text
  }

4. ability to upload jd and company_name, run parses and store in jds table
5. run analyze function for each resume <> jd and store it in a new table
   so tables become - resumes - jds and analysis

analysis table -
analysis_id
id_from_resumes_table
id_from_jd_table
analysis
