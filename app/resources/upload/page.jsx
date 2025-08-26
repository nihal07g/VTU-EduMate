'use client'

import React, { useState, useRef } from 'react';
import { ModeSelector } from '../../../components/mode-selector';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const ThemeToggle = dynamic(() => import('../../../components/theme-toggle'), { ssr: false });

// UploadResult structure:
// {
//   success: boolean,
//   message: string,
//   data?: any,
//   error?: string
// }

export default function PDFUploadPage() {
  // Form state
  const [scheme, setScheme] = useState('');
  const [semester, setSemester] = useState('');
  const [branch, setBranch] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // UI state
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (file) {
      if (file.type === 'application/pdf') {
        if (file.size > 15 * 1024 * 1024) {
             setUploadResult({ 
               success: false, 
               message: 'File is too large. Maximum size is 15MB.', 
               error: 'File is too large. Maximum size is 15MB.' 
             });
             setSelectedFile(null);
        } else {
            setSelectedFile(file);
        }
      } else {
        setUploadResult({ 
          success: false, 
          message: 'Invalid file type. Please select a PDF.', 
          error: 'Invalid file type. Please select a PDF.' 
        });
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !scheme || !semester || !branch || !subject) {
      setUploadResult({
        success: false,
        message: 'Please fill all required fields and select a PDF file',
        error: 'Please fill all required fields and select a PDF file'
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('scheme', scheme);
      formData.append('semester', semester);
      formData.append('branch', branch);
      formData.append('subject', subject);
      formData.append('subjectCode', subjectCode);
      formData.append('description', description);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult({
          success: true,
          message: 'PDF uploaded successfully to MongoDB Atlas!',
          data: result
        });
        
        // Reset form
        setSelectedFile(null);
        setScheme('');
        setSemester('');
        setBranch('');
        setSubject('');
        setSubjectCode('');
        setDescription('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setUploadResult({
          success: false,
          message: result.error || 'Upload failed',
          error: result.error || 'Upload failed'
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Network error. Please check connection and try again.',
        error: 'Network error. Please check connection and try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <span className="text-2xl font-bold text-white">📤</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Upload VTU Resources
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add Study Materials</p>
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
            Upload{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
              Study Materials
            </span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
            Contribute to the VTU Resources library by uploading PDF notes and study materials
          </p>
        </div>

        {/* Upload Form */}
        <div className="max-w-4xl mx-auto bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 space-y-8">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">
                📚 Add New Study Material
              </h3>
              <Link href="/resources" passHref>
                <button type="button" className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-xl shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300">
                  ← Back to Resources
                </button>
              </Link>
            </div>

            <div className="space-y-8">
              {/* Course Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">🎓 VTU Scheme *</label>
                  <select
                    value={scheme}
                    onChange={(e) => setScheme(e.target.value)}
                    required
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Scheme</option>
                    {schemeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">⚙️ Branch *</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Branch</option>
                    {branchOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">📅 Semester *</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Semester</option>
                    {semesterOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">📖 Subject Name *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Data Structures and Applications"
                    required
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-gray-300">🔢 Subject Code</label>
                  <input
                    type="text"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="e.g., BCS304"
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300">📄 PDF File *</label>
                <div
                  className={`mt-2 p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                  {selectedFile ? (
                    <div className="text-green-600 dark:text-green-400">
                      <p className="text-4xl">✅</p>
                      <p className="font-bold text-lg mt-2">{selectedFile.name}</p>
                      <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="text-4xl">📁</p>
                      <p className="font-semibold mt-2">Drop PDF here or click to browse</p>
                      <p className="text-sm mt-1">Maximum file size: 15MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300">📝 Description (Optional)</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the study material..."
                    rows={3}
                    className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading to MongoDB Atlas...
                  </>
                ) : (
                  <>
                    📤
                    Upload PDF to VTU Resources
                  </>
                )}
              </button>
            </div>
            </form>

            {/* Upload Result */}
            {uploadResult && (
              <div className={`mt-8 p-6 rounded-2xl border-2 ${uploadResult.success ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700' : 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700'}`}>
                <div className="flex items-start gap-4">
                  <div className={`text-3xl ${uploadResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {uploadResult.success ? '✅' : '❌'}
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold ${uploadResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                      {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                    </h4>
                    <p className={`mt-1 text-sm ${uploadResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {uploadResult.message || uploadResult.error}
                    </p>
                    {uploadResult.success && (
                      <div className="mt-4">
                        <Link href="/resources" passHref>
                          <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                            View in Resources
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
