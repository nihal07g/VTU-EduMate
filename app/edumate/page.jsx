'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { getAiResponse, getMarkedAnswer } from '../../lib/client-actions';
import { 
  getAvailableSubjects, 
  getAllAvailableBranches, 
  getAllAvailableSemesters,
  getBranchFullName,
  Subject 
} from '../../utils/subjectUtils';
import { ModeSelector } from '../../components/mode-selector';

const ThemeToggle = dynamic(() => import('../../components/theme-toggle'), {
  ssr: false,
  loading: () => <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
});

// MLAnalysis structure:
// {
//   confidence: number,
//   complexityLevel: string,
//   recommendedMarks: number,
//   topicCategory: string,
//   syllabusTags: string[],
//   academicInsights: {
//     difficultyScore: number,
//     learningPath: string,
//     estimatedStudyTime: string
//   },
//   mlMetadata: {
//     modelVersion: string,
//     processingTime: string,
//     algorithms: string[]
//   }
// }

// VideoRecommendation structure:
// {
//   title: string,
//   url: string,
//   relevance: number,
//   duration: string,
//   channel: string,
//   description: string,
//   difficulty: string
// }

export default function VTUEduMate() {
  const [mounted, setMounted] = useState(false);
  const [scheme, setScheme] = useState('');
  const [semester, setSemester] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMarksOptions, setShowMarksOptions] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [mlAnalysis, setMlAnalysis] = useState(null);
  const [videoRecommendations, setVideoRecommendations] = useState([]);

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scheme) {
      const branches = getAllAvailableBranches(scheme);
      setAvailableBranches(branches);
    } else {
      setAvailableBranches([]);
    }
    setBranch('');
    setSemester('');
    setSelectedSubject('');
  }, [scheme]);

  useEffect(() => {
    if (scheme && branch) {
      const semesters = getAllAvailableSemesters(scheme, branch);
      setAvailableSemesters(semesters);
    } else {
      setAvailableSemesters([]);
    }
    setSemester('');
    setSelectedSubject('');
  }, [scheme, branch]);

  useEffect(() => {
    if (scheme && semester && branch) {
      const subjects = getAvailableSubjects(scheme, semester, branch);
      setAvailableSubjects(subjects);
    } else {
      setAvailableSubjects([]);
    }
    setSelectedSubject('');
  }, [scheme, semester, branch]);

  const schemeOptions = [
    { value: '2021', label: '2021 Scheme' },
    { value: '2022', label: '2022 Scheme' }
  ];

  const handleSubmit = useCallback(async () => {
    setError('');
    setShowMarksOptions(false);
    
    // Validate selections
    const errors = [];
    if (!scheme) errors.push('Please select a VTU scheme');
    if (!branch) errors.push('Please select your engineering branch');
    if (!semester) errors.push('Please select a semester');
    if (!selectedSubject) errors.push('Please select a specific subject');
    if (!question.trim()) errors.push('Please enter your question');
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }
    
    const selectedSubjectData = availableSubjects.find(s => s.code === selectedSubject);
    setLoading(true);
    
    try {
      const response = await getAiResponse(
        question.trim(),
        scheme,
        semester,
        branch,
        selectedSubject,
        selectedSubjectData?.name || ''
      );
      
      if (response.success) {
        setAnswer(response.answer);
        setMlAnalysis(null); // ML analysis not available in static deployment
        setVideoRecommendations([]); // Video recommendations not available in static deployment
        if (response.prompt) {
          setCurrentPrompt(response.prompt);
        }
        setShowMarksOptions(true);
      } else {
        setError(response.error || 'Failed to generate answer');
        setAnswer('');
      }
    } catch (error) {
      setError('Unable to process your question. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [question, scheme, semester, branch, selectedSubject, availableSubjects]);

  const handleMarksAdjustment = useCallback(async (marks) => {
    if (!answer || loading || !currentPrompt) return;
    
    setLoading(true);
    try {
      const response = await getMarkedAnswer({
        prompt: currentPrompt,
        marks,
        question
      });
      
      if (response.success && response.answer) {
        setAnswer(response.answer);
      } else {
        setError(response.error || 'Failed to adjust answer format');
      }
    } catch (error) {
      setError('Error adjusting answer format');
    } finally {
      setLoading(false);
    }
  }, [answer, loading, question, currentPrompt]);

  const selectedSubjectData = availableSubjects.find(s => s.code === selectedSubject);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden shadow-lg animate-pulse">
            <Image 
              src="/logo.png" 
              alt="VTU EduMate Logo" 
              width={64}
              height={64}
              className="w-16 h-16 object-cover"
            />
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Loading VTU EduMate...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 text-gray-900 dark:text-gray-100">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden shadow-lg">
              <Image 
                src="/logo.png" 
                alt="VTU EduMate Logo" 
                width={40}
                height={40}
                className="w-10 h-10 object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                VTU EduMate
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Learning Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ML Active
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                AI Ready
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <ModeSelector />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6 mt-6">
          
          {/* Left Sidebar - Course Selection */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📚</span>
                </div>
                <h3 className="text-lg font-bold">Course Selection</h3>
              </div>

              <div className="space-y-4">
                {/* Scheme Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    VTU Scheme
                  </label>
                  <select
                    value={scheme}
                    onChange={(e) => setScheme(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select Scheme</option>
                    {schemeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    disabled={!scheme}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">Select Branch</option>
                    {availableBranches.map(branchCode => (
                      <option key={branchCode} value={branchCode}>
                        {branchCode} - {getBranchFullName(branchCode, scheme)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    disabled={!scheme || !branch}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">Select Semester</option>
                    {availableSemesters.map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!scheme || !semester || !branch || availableSubjects.length === 0}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">
                      {availableSubjects.length === 0 ? 'No subjects available' : 'Select Subject'}
                    </option>
                    {availableSubjects.map(subject => (
                      <option key={subject.code} value={subject.code}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Info */}
                {selectedSubjectData && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-sm mb-1">
                      {selectedSubjectData.name}
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {selectedSubjectData.code} | {selectedSubjectData.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center - Question Input & Answer */}
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              
              {/* Question Input */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🤖</span>
                  </div>
                  <h3 className="text-lg font-bold">Ask Your Question</h3>
                </div>

                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={selectedSubjectData ? 
                    `Ask about ${selectedSubjectData.name}. AI will analyze with ML models for VTU ${scheme} scheme...` :
                    "Select course details first to enable AI-powered question processing..."
                  }
                  className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  rows={6}
                />

                {/* Error Display */}
                {error && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm">
                    ⚠️ {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing with AI...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      Get AI Answer
                    </>
                  )}
                </button>
              </div>

              {/* Loading Animation */}
              {loading && !answer && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl p-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                      AI Processing...
                    </div>
                  </div>
                  <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
                    <p>Analyzing with ML models</p>
                    <p>Generating VTU-optimized response</p>
                  </div>
                </div>
              )}

              {/* Answer Display */}
              {answer && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
                  <div className="p-4 border-b border-green-200/50 dark:border-green-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
                        <Image 
                          src="/logo.png" 
                          alt="VTU EduMate Logo" 
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-green-800 dark:text-green-200">VTU EduMate Answer</h3>
                        <p className="text-xs text-green-600 dark:text-green-400">AI-Powered Learning Assistant</p>
                      </div>
                    </div>
                    
                    {showMarksOptions && (
                      <div className="flex items-center gap-2">
                        {[2, 5, 10].map(marks => (
                          <button
                            key={marks}
                            onClick={() => handleMarksAdjustment(marks)}
                            disabled={loading}
                            className="px-3 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 disabled:opacity-50"
                          >
                            {marks} Marks
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none p-4 text-gray-800 dark:text-gray-200"
                    dangerouslySetInnerHTML={{ __html: answer.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - ML Analysis & Videos */}
          <div className="col-span-12 lg:col-span-3">
            {mlAnalysis && (
              <div className="space-y-4">
                {/* ML Analysis */}
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">🧠</span>
                    </div>
                    <h3 className="text-lg font-bold">ML Analysis</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Confidence</span>
                      <span className="font-semibold">{(mlAnalysis.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Complexity</span>
                      <span className="font-semibold capitalize">{mlAnalysis.complexityLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Marks</span>
                      <span className="font-semibold">{mlAnalysis.recommendedMarks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Study Time</span>
                      <span className="font-semibold text-xs">{mlAnalysis.academicInsights?.estimatedStudyTime}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {mlAnalysis.mlMetadata?.algorithms?.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Video Recommendations */}
                {videoRecommendations.length > 0 && (
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">🎥</span>
                      </div>
                      <h3 className="text-lg font-bold">Recommended Videos</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {videoRecommendations.slice(0, 3).map((video, index) => (
                        <a
                          key={index}
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group"
                        >
                          <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-2">
                            {video.title}
                          </h5>
                          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                            <span>{video.duration}</span>
                            <span className="capitalize">{video.difficulty}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {video.description}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
