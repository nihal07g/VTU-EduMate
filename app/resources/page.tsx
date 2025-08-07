'use client'

import React, { useState, useEffect } from 'react';
import { ModeSelector } from '../../components/mode-selector';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const ThemeToggle = dynamic(() => import('../../components/theme-toggle'), { ssr: false });

interface PDFResource {
  _id: string;
  filename: string;
  originalName: string;
  scheme: string;
  semester: string;
  branch: string;
  subject: string;
  subjectCode: string;
  fileSize: number;
  uploadDate: string;
  downloadCount: number;
  description?: string;
}

export default function VTUResourcesPage() {
  const [scheme, setScheme] = useState('');
  const [semester, setSemester] = useState('');
  const [branch, setBranch] = useState('');
  const [resources, setResources] = useState<PDFResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const schemeOptions = [
    { value: '2021', label: '2021 Scheme' },
    { value: '2022', label: '2022 Scheme' }
  ];

  const branchOptions = [
    { value: 'CSE', label: 'Computer Science Engineering' },
    { value: 'ISE', label: 'Information Science Engineering' },
    { value: 'ECE', label: 'Electronics & Communication Engineering' },
    { value: 'EEE', label: 'Electrical & Electronics Engineering' },
    { value: 'ME', label: 'Mechanical Engineering' },
    { value: 'Civil', label: 'Civil Engineering' }
  ];

  const semesterOptions = Array.from({length: 8}, (_, i) => ({
    value: (i + 1).toString(),
    label: `Semester ${i + 1}`
  }));

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (scheme) params.append('scheme', scheme);
      if (semester) params.append('semester', semester);
      if (branch) params.append('branch', branch);

      const response = await fetch(`/api/get-resources?${params}`);
      const data = await response.json();

      if (data.success) {
        setResources(data.resources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [scheme, semester, branch, fetchResources]);

  const handleDownload = async (fileId: string, filename: string) => {
    setDownloading(fileId);
    try {
      const response = await fetch(`/api/download-pdf?id=${fileId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        await fetchResources();
      } else {
        alert('Download failed. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please check your connection.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <span className="text-2xl font-bold text-white">📚</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                VTU Resources
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Download Study Materials</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ModeSelector />

        {/* Hero Section */}
        <div className="text-center my-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            VTU Study{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-500">
              Materials
            </span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
            Access and download comprehensive PDF notes for all VTU subjects
          </p>
        </div>

        {/* Filter and Upload Section */}
        <div className="max-w-7xl mx-auto bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">
                📂 Browse Study Materials
              </h3>
              <Link href="/resources/upload" passHref>
                <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
                  📤 Upload PDF
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">🎓 VTU Scheme</label>
                  <select
                    value={scheme}
                    onChange={(e) => setScheme(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Schemes</option>
                    {schemeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
              </div>

              <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">⚙️ Engineering Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Branches</option>
                    {branchOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
              </div>

              <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">📅 Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Semesters</option>
                    {semesterOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Display */}
        <div className="max-w-7xl mx-auto mt-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">
              📖 Available Resources ({resources.length})
            </h3>
          </div>

            {loading ? (
              <div className="text-center py-16">
                <p className="text-lg font-semibold">Loading resources...</p>
              </div>
            ) : resources.length > 0 ? (
              <div className="space-y-6">
                {resources.map((resource) => (
                  <div key={resource._id} className="bg-white dark:bg-gray-800/80 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 flex items-center justify-between backdrop-blur-sm">
                      <div className="flex-grow">
                          <div className="flex items-center gap-4">
                              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                  <span className="text-2xl">📄</span>
                              </div>
                              <div>
                                  <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{resource.subject}</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{resource.subjectCode} - {resource.originalName}</p>
                              </div>
                          </div>
                          
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                              <span className="font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">📚 {resource.scheme} Scheme</span>
                              <span className="font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">🎓 Semester {resource.semester}</span>
                              <span className="font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">⚙️ {resource.branch}</span>
                              <span>📁 {(resource.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                              <span>⬇️ {resource.downloadCount} downloads</span>
                              <span>📅 {new Date(resource.uploadDate).toLocaleDateString()}</span>
                          </div>

                          {resource.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pl-2 border-l-2 border-gray-200 dark:border-gray-600">{resource.description}</p>
                          )}
                      </div>

                      <button
                        onClick={() => handleDownload(resource._id, resource.originalName)}
                        disabled={downloading === resource._id}
                        className="ml-6 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {downloading === resource._id ? (
                          <div className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Downloading...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📥</span>
                            Download PDF
                          </div>
                        )}
                      </button>
                    </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-4xl">📚</p>
                <p className="text-xl font-semibold mt-4">No Study Materials Found</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {scheme || semester || branch ? 
                    'No PDF resources available for selected criteria. Try different filters.' : 
                    'Select filters above to browse available study materials.'
                  }
                </p>
                <Link href="/resources/upload" passHref>
                  <button className="mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
                    📤 Upload First PDF
                  </button>
                </Link>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
