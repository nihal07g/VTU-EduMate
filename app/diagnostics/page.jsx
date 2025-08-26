'use client'

import { useState } from 'react';
import { runGeminiDiagnostics } from '../../lib/client-actions';

export default function DiagnosticsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const diagnostics = await runGeminiDiagnostics();
      setReport(diagnostics);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReport({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">VTU EduMate API Diagnostics</h1>
      <button
        onClick={runTest}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Running Diagnostics...' : 'Test Gemini API'}
      </button>

      {report && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Diagnostic Report</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
