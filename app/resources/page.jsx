'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { ModeSelector } from '../../components/mode-selector';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getResources, downloadResource } from '../../lib/static-data-service';

const ThemeToggle = dynamic(() => import('../../components/theme-toggle'), { ssr: false });

// PDFResource structure:
// {
//   _id: string,
//   filename: string,
//   originalName: string,
//   scheme: string,
//   semester: string,
//   branch: string,
//   subject: string,
//   subjectCode: string,
//   fileSize: number,
//   uploadDate: string,
//   downloadCount: number,
//   description?: string,
//   googleDriveUrl?: string,
//   previewUrl?: string,
//   tags?: string[]
// }

export default function VTUResourcesPage() {
  const [scheme, setScheme] = useState('');
  const [semester, setSemester] = useState('');
  const [branch, setBranch] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<PDFResource | null>(null);

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

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getResources({
        scheme,
        semester,
        branch
      });

      if (result.resources) {
        setResources(result.resources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }, [scheme, semester, branch]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleDownload = async (fileId, filename) => {
    setDownloading(fileId);
    
    try {
      const result = await downloadResource(fileId);
      
      if (result.success && result.url) {
        // Open Google Drive download in new tab
        window.open(result.url, '_blank');
        
        // Update local state to reflect download count increase
        setResources(prev => prev.map(resource => 
          resource._id === fileId 
            ? { ...resource, downloadCount: resource.downloadCount + 1 }
            : resource
        ));
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

  const handlePreview = (resource) => {
    setSelectedResource(resource);
    setPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setPreviewModalOpen(false);
    setSelectedResource(null);
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

        {/* Available Resources Count Banner */}
        {resources.length > 0 && (
          <div className="max-w-7xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50 p-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🎉</span>
                <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                  {resources.length} Study Material{resources.length > 1 ? 's' : ''} Available
                  {scheme && semester && branch && (
                    <span className="text-green-600 dark:text-green-400">
                      {' '}for {scheme} Scheme, Semester {semester}, {branch}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

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
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  >
                    <option value="">All Schemes</option>
                    {schemeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
              </div>

              <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">📅 Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  >
                    <option value="">All Semesters</option>
                    {semesterOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
              </div>

              <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">⚙️ Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  >
                    <option value="">All Branches</option>
                    {branchOptions.map(option => (
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-lg font-semibold mt-4">Loading resources...</p>
              </div>
            ) : resources.length > 0 ? (
              <div className="space-y-6">
                {resources.map((resource) => (
                  <div key={resource._id} className="bg-white dark:bg-gray-800/80 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 flex items-center justify-between backdrop-blur-sm">
                      <div className="flex-grow">
                          <div className="flex items-center gap-4">
                              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                                  <span className="text-2xl">☁️</span>
                              </div>
                              <div>
                                  <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{resource.subject}</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{resource.subjectCode} - {resource.originalName}</p>
                                  {resource.tags && resource.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {resource.tags.slice(0, 3).map((tag, index) => (
                                        <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
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

                      <div className="flex items-center gap-3 ml-6">
                        {/* Preview Button */}
                        {resource.previewUrl && (
                          <button
                            onClick={() => handlePreview(resource)}
                            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👁️</span>
                              Preview
                            </div>
                          </button>
                        )}
                        
                        {/* Download Button */}
                        <button
                          onClick={() => handleDownload(resource._id, resource.originalName)}
                          disabled={downloading === resource._id}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

      {/* Preview Modal */}
      {previewModalOpen && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold">{selectedResource.subject}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedResource.subjectCode} - {selectedResource.originalName}</p>
              </div>
              <button
                onClick={closePreviewModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-6">
              <iframe
                src={selectedResource.previewUrl}
                className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
                frameBorder="0"
                title={`Preview: ${selectedResource.subject}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
