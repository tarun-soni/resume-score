'use client';

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001';

interface Resume {
  id: string;
  identifier: string;
  created_at: string;
}

interface AnalysisResult {
  resume_id: string;
  identifier: string;
  overall_score: number;
  analysis: any;
  error?: string;
}

interface ResumeUpload {
  file: File | null;
  label: string;
}

export default function Home() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [jdText, setJdText] = useState('');
  const [resumeUploads, setResumeUploads] = useState<ResumeUpload[]>([
    { file: null, label: '' },
    { file: null, label: '' },
    { file: null, label: '' },
    { file: null, label: '' },
    { file: null, label: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch(`${API_BASE}/resumes`);
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const handleFileChange = (index: number, file: File | null) => {
    const newUploads = [...resumeUploads];
    newUploads[index].file = file;
    if (file && !newUploads[index].label) {
      // Auto-fill label from filename without extension
      newUploads[index].label = file.name.replace(/\.[^/.]+$/, '');
    }
    setResumeUploads(newUploads);
  };

  const handleLabelChange = (index: number, label: string) => {
    const newUploads = [...resumeUploads];
    newUploads[index].label = label;
    setResumeUploads(newUploads);
  };

  const handleUpload = async () => {
    const filesToUpload = resumeUploads.filter((ru) => ru.file !== null);

    if (filesToUpload.length === 0) {
      alert('Please select at least one resume');
      return;
    }

    // Check for missing labels
    const missingLabels = filesToUpload.filter((ru) => !ru.label.trim());
    if (missingLabels.length > 0) {
      alert('Please provide labels for all selected resumes');
      return;
    }

    setLoading(true);

    try {
      for (const upload of filesToUpload) {
        const formData = new FormData();
        formData.append('resume', upload.file!);
        formData.append('identifier', upload.label.trim());

        const response = await fetch(`${API_BASE}/resumes`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to upload ${upload.label}`);
        }
      }

      alert('All resumes uploaded successfully!');
      // Reset form
      setResumeUploads([
        { file: null, label: '' },
        { file: null, label: '' },
        { file: null, label: '' },
        { file: null, label: '' },
        { file: null, label: '' },
      ]);
      await fetchResumes();
    } catch (error: any) {
      alert(`Error uploading resumes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRank = async () => {
    if (!jdText.trim()) {
      alert('Please enter a job description');
      return;
    }

    if (resumes.length === 0) {
      alert('No resumes in database. Please upload resumes first.');
      return;
    }

    setAnalyzing(true);
    setResults([]);
    setSelectedResumeId(null);

    try {
      const response = await fetch(`${API_BASE}/analyze-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jd_text: jdText,
          company_name: companyName || 'Unknown',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze resumes');
      }

      const data = await response.json();
      setResults(data.results);
      if (data.results.length > 0) {
        setSelectedResumeId(data.results[0].resume_id);
      }
    } catch (error: any) {
      alert(`Error analyzing resumes: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/resumes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      alert('Resume deleted successfully');
      await fetchResumes();
      // Clear results if deleted resume was in them
      setResults([]);
      setSelectedResumeId(null);
    } catch (error: any) {
      alert(`Error deleting resume: ${error.message}`);
    }
  };

  const selectedResult = results.find((r) => r.resume_id === selectedResumeId);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 min-h-screen">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-bold text-slate-900 text-4xl md:text-5xl">
            Resume Comparison Tool
          </h1>
          <p className="text-slate-600">
            Upload your resumes, paste a job description, and find your best
            match
          </p>
        </div>

        {/* Stored Resumes */}
        <div className="bg-white shadow-sm mb-6 p-6 border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-900 text-xl">
              Stored Resumes ({resumes.length})
            </h2>
          </div>
          {resumes.length === 0 ? (
            <div className="py-8 text-center">
              <svg
                className="mx-auto w-12 h-12 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-2 text-slate-500">No resumes uploaded yet</p>
            </div>
          ) : (
            <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 hover:border-slate-300 rounded-lg transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {resume.identifier}
                    </p>
                    <p className="mt-1 text-slate-500 text-xs">
                      {new Date(resume.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteResume(resume.id)}
                    className="hover:bg-red-50 ml-3 p-2 rounded text-red-600 hover:text-red-700 transition"
                    title="Delete"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload New Resumes */}
        <div className="bg-white shadow-sm mb-6 p-6 border border-slate-200 rounded-xl">
          <h2 className="mb-4 font-semibold text-slate-900 text-xl">
            Upload Resumes (Max 5)
          </h2>
          <div className="space-y-4">
            {resumeUploads.map((upload, index) => (
              <div
                key={index}
                className="flex md:flex-row flex-col gap-3 bg-slate-50 p-4 border border-slate-200 rounded-lg"
              >
                <div className="flex-1">
                  <label className="block mb-2 font-medium text-slate-700 text-sm">
                    Resume Label #{index + 1}
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g., "Frontend Resume" or "My Main Resume"`}
                    value={upload.label}
                    onChange={(e) => handleLabelChange(index, e.target.value)}
                    className="px-4 py-2 border border-slate-300 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-black"
                  />
                </div>
                <div className="flex-1">
                  <label className="block mb-2 font-medium text-slate-700 text-sm">
                    PDF File
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      handleFileChange(index, e.target.files?.[0] || null)
                    }
                    className="block hover:file:bg-blue-100 file:bg-blue-50 file:mr-4 file:px-4 file:py-2 file:border-0 file:rounded-lg w-full file:font-semibold text-black text-slate-500 file:text-blue-700 text-sm file:text-sm file:cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={loading || !resumeUploads.some((ru) => ru.file !== null)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 shadow-sm mt-6 px-8 py-3 rounded-lg w-full md:w-auto font-semibold text-white transition disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex justify-center items-center">
                <svg
                  className="mr-2 w-5 h-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload Resumes'
            )}
          </button>
        </div>

        {/* Job Description */}
        <div className="bg-white shadow-sm mb-6 p-6 border border-slate-600 rounded-xl">
          <h2 className="mb-4 font-semibold text-slate-900 text-xl">
            Job Description
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Company Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Google, Microsoft, etc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="px-4 py-2 border border-slate-300 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-black"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-slate-700 text-sm">
                Job Description
              </label>
              <textarea
                placeholder="Paste the complete job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={12}
                className="px-4 py-3 border border-slate-300 focus:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full font-mono text-black text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleRank}
            disabled={analyzing || !jdText.trim() || resumes.length === 0}
            className="bg-gradient-to-r from-green-600 hover:from-green-700 disabled:from-slate-400 to-emerald-600 hover:to-emerald-700 disabled:to-slate-400 shadow-lg mt-6 px-8 py-4 rounded-lg w-full font-bold text-white text-lg transition disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <span className="flex justify-center items-center">
                <svg
                  className="mr-3 w-6 h-6 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Analyzing Resumes... ({results.length}/{resumes.length})
              </span>
            ) : (
              '🏆 Rank My Resumes'
            )}
          </button>
        </div>

        {/* Results - Horizontal Scrollable Cards */}
        {results.length > 0 && (
          <div className="bg-white shadow-sm p-6 border border-slate-200 rounded-xl">
            <h2 className="mb-6 font-bold text-slate-900 text-2xl">
              Results - Best to Worst
            </h2>

            {/* Horizontal Scroll Container */}
            <div className="-mx-2 px-2 pb-4 overflow-x-auto">
              <div className="flex gap-4 min-w-min">
                {results.map((result, idx) => {
                  const isSelected = selectedResumeId === result.resume_id;
                  const borderColor =
                    idx === 0
                      ? 'border-green-500'
                      : idx === 1
                      ? 'border-blue-500'
                      : idx === 2
                      ? 'border-amber-500'
                      : 'border-slate-300';

                  const bgColor =
                    idx === 0
                      ? 'bg-green-50'
                      : idx === 1
                      ? 'bg-blue-50'
                      : idx === 2
                      ? 'bg-amber-50'
                      : 'bg-white';

                  return (
                    <div
                      key={result.resume_id}
                      onClick={() => setSelectedResumeId(result.resume_id)}
                      className={`flex-shrink-0 w-72 p-6 border-2 rounded-xl cursor-pointer transition-all ${borderColor} ${bgColor} ${
                        isSelected
                          ? 'ring-4 ring-purple-500 ring-opacity-50 shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 text-2xl">
                            #{idx + 1}
                          </span>
                          {idx === 0 && <span className="text-2xl">🏆</span>}
                          {idx === 1 && <span className="text-2xl">🥈</span>}
                          {idx === 2 && <span className="text-2xl">🥉</span>}
                        </div>
                        {result.error ? (
                          <span className="font-semibold text-red-600 text-sm">
                            Error
                          </span>
                        ) : (
                          <div className="text-right">
                            <div className="font-black text-slate-900 text-4xl">
                              {result.overall_score}
                            </div>
                            <div className="font-medium text-slate-500 text-xs">
                              Score
                            </div>
                          </div>
                        )}
                      </div>
                      <h3 className="mb-2 font-bold text-slate-900 text-lg line-clamp-2">
                        {result.identifier}
                      </h3>
                      {result.error ? (
                        <p className="text-red-600 text-sm">{result.error}</p>
                      ) : (
                        <p className="text-slate-600 text-sm">
                          {result.analysis?.Verdict || 'Click to view details'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Analysis for Selected Resume */}
            {selectedResult && !selectedResult.error && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 mt-8 p-6 border-2 border-purple-200 rounded-xl">
                <h3 className="flex items-center gap-2 mb-6 font-bold text-slate-900 text-2xl">
                  <span className="text-purple-600">📊</span>
                  Detailed Analysis: {selectedResult.identifier}
                </h3>

                {/* Score Breakdown Grid */}
                <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {Object.entries(selectedResult.analysis)
                    .filter(
                      ([key]) =>
                        ![
                          'Overall Score',
                          'Verdict',
                          'Contradictions',
                          'GlobalSuggestions',
                          'raw',
                        ].includes(key)
                    )
                    .map(([key, value]: [string, any]) => (
                      <div
                        key={key}
                        className="bg-white shadow-sm hover:shadow-md p-5 border border-slate-200 rounded-lg transition"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-slate-700 text-sm">
                            {key}
                          </h4>
                          <span className="font-black text-blue-600 text-3xl">
                            {value.score}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {value.reason}
                        </p>
                      </div>
                    ))}
                </div>

                {/* Verdict */}
                {selectedResult.analysis.Verdict && (
                  <div className="bg-purple-50 mb-6 p-5 border-2 border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">⚖️</span>
                      <strong className="font-bold text-purple-900 text-lg">
                        Verdict:
                      </strong>
                    </div>
                    <span className="font-semibold text-purple-800 text-lg">
                      {selectedResult.analysis.Verdict}
                    </span>
                  </div>
                )}

                {/* Top Suggestions */}
                {selectedResult.analysis.GlobalSuggestions &&
                  Array.isArray(selectedResult.analysis.GlobalSuggestions) &&
                  selectedResult.analysis.GlobalSuggestions.length > 0 && (
                    <div className="bg-amber-50 p-5 border-2 border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">💡</span>
                        <strong className="font-bold text-amber-900 text-lg">
                          Top Improvements:
                        </strong>
                      </div>
                      <ul className="space-y-2">
                        {selectedResult.analysis.GlobalSuggestions.map(
                          (suggestion: string, i: number) => (
                            <li
                              key={i}
                              className="flex items-start gap-3 text-amber-800"
                            >
                              <span className="flex flex-shrink-0 justify-center items-center bg-amber-200 rounded-full w-6 h-6 font-bold text-sm">
                                {i + 1}
                              </span>
                              <span className="text-sm leading-relaxed">
                                {suggestion}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
