'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
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

interface MLAnalysis {
  confidence: number;
  complexityLevel: string;
  recommendedMarks: number;
  topicCategory: string;
  syllabusTags: string[];
}

interface VideoRecommendation {
  title: string;
  url: string;
  relevance: number;
  duration: string;
  channel: string;
}

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
  const [mlAnalysis, setMlAnalysis] = useState<MLAnalysis | null>(null);
  const [videoRecommendations, setVideoRecommendations] = useState<VideoRecommendation[]>([]);

  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);

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

  const validateSelections = () => {
    const errors = [];
    if (!scheme) errors.push('Please select a VTU scheme');
    if (!branch) errors.push('Please select your engineering branch');
    if (!semester) errors.push('Please select a semester');
    if (!selectedSubject) errors.push('Please select a specific subject');
    if (!question.trim()) errors.push('Please enter your question');
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    return true;
  };

  const handleSubmit = useCallback(async () => {
    setError('');
    setShowMarksOptions(false);
    
    if (!validateSelections()) return;
    
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
        setVideoRecommendations(response.videoRecommendations || []); // Set video recommendations from response
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
  }, [question, scheme, semester, branch, selectedSubject, availableSubjects, validateSelections]);

  const handleMarksAdjustment = useCallback(async (marks: number) => {
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-white">E</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Loading VTU EduMate...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-all duration-500">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">E</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  VTU EduMate
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI Scholar Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-600 dark:text-slate-400">Python ML</span>
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Research Grade</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ModeSelector />
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
            🤖 Custom GPT • Python ML • VTU Trained
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            VTU{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              EduMate
            </span>
          </h2>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Advanced AI assistant with Python ML models trained on VTU syllabus patterns and examination guidelines.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar - Course Selection */}
          <div className="lg:col-span-4">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 sticky top-24">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📚</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Course Selection</h3>
              </div>

              <div className="space-y-4">
                {/* Scheme Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    🎓 VTU Scheme
                  </label>
                  <select
                    value={scheme}
                    onChange={(e) => setScheme(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Choose Scheme</option>
                    {schemeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    ⚙️ Engineering Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    disabled={!scheme}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose Branch</option>
                    {availableBranches.map(branchCode => (
                      <option key={branchCode} value={branchCode}>
                        {branchCode} - {getBranchFullName(branchCode, scheme)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    📅 Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    disabled={!scheme || !branch}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose Semester</option>
                    {availableSemesters.map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    📖 Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!scheme || !semester || !branch || availableSubjects.length === 0}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {availableSubjects.length === 0 ? 'No subjects available' : 'Choose Subject'}
                    </option>
                    {availableSubjects.map(subject => (
                      <option key={subject.code} value={subject.code}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Details */}
                {selectedSubjectData && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-sm mb-1">
                      📚 {selectedSubjectData.name}
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                      Code: {selectedSubjectData.code}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {selectedSubjectData.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-8">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">🤖</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Assistant</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Ask your VTU questions</p>
                    </div>
                  </div>
                  
                  {mlAnalysis && (
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">
                        {(mlAnalysis.confidence * 100).toFixed(0)}% Confidence
                      </span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium">
                        {mlAnalysis.complexityLevel.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="p-6 min-h-[500px] max-h-[600px] overflow-y-auto">
                
                {/* Question Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    💭 Your Question
                  </label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={selectedSubjectData ? 
                      `Ask your VTU question about ${selectedSubjectData.name}. Our Python ML models will process it according to VTU syllabus guidelines...` :
                      "Please select your course details first to enable Python ML-powered question processing..."
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                    rows={4}
                  />
                  
                  {error && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-700/50 text-sm">
                      ⚠️ {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={loading || !question.trim()}
                    className="w-full mt-4 flex items-center justify-center space-x-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing with ML...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Get AI Answer</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Loading Animation */}
                {loading && !answer && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Processing with Python ML</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Analyzing question and generating response...</p>
                    </div>
                  </div>
                )}

                {/* Answer Display */}
                {answer && (
                  <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 overflow-hidden">
                    {/* Answer Header */}
                    <div className="px-4 py-3 bg-emerald-100/50 dark:bg-emerald-900/30 border-b border-emerald-200/50 dark:border-emerald-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">E</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">VTU EduMate Response</h4>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">Custom GPT • Python ML • Research Grade</p>
                          </div>
                        </div>
                        
                        {showMarksOptions && (
                          <div className="flex space-x-2">
                            {[2, 5, 10].map(marks => (
                              <button
                                key={marks}
                                onClick={() => handleMarksAdjustment(marks)}
                                disabled={loading}
                                className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 disabled:opacity-50"
                              >
                                {marks} Marks
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Answer Content */}
                    <div className="p-6">
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: answer
                            .replace(/\n/g, '<br />')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        }}
                      />
                    </div>
                    
                    {/* Video Recommendations */}
                    {videoRecommendations.length > 0 && (
                      <div className="px-6 pb-4">
                        <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-2">
                          <span>🎥</span>
                          <span>ML-Recommended Videos</span>
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {videoRecommendations.slice(0, 4).map((video, index) => (
                            <a
                              key={index}
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-200 group"
                            >
                              <h6 className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-2">
                                {video.title}
                              </h6>
                              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                                <span>{(video.relevance * 100).toFixed(0)}% relevant</span>
                                <span>{video.duration}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Answer Footer */}
                    <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1">
                          <span>🎓</span>
                          <span>VTU {scheme} Scheme</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>📚</span>
                          <span>{selectedSubjectData?.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>🐍</span>
                          <span>Python ML</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>⭐</span>
                          <span>Research Grade</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simplified Footer */}
      <footer className="text-center py-8 mt-16 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">E</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              VTU EduMate
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Custom GPT • Python ML Models • Research-Grade VTU Assistant
          </p>
        </div>
      </footer>
    </div>
  );
}
