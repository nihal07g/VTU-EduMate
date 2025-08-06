'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getAiResponse, getMarkedAnswer } from '../actions';
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
        setMlAnalysis(response.mlAnalysis || null);
        setVideoRecommendations(response.videoRecommendations || []);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 text-gray-900 dark:text-gray-100 font-sans transition-all duration-300">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="container mx-auto px-6 lg:px-8 flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
              <span className="text-2xl font-bold text-white">E</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VTU EduMate
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Custom GPT with Python ML</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Python ML
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Research-Grade
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 lg:px-8 py-8">
        <ModeSelector />
        
        {/* Hero Section */}
        <div className="text-center my-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            🤖 Custom GPT • Python ML Models • VTU Syllabus Trained
          </div>
          
          <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight mb-6">
            VTU{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
              EduMate
            </span>
          </h2>
          
          <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Advanced AI assistant with custom Python ML models trained on VTU syllabus patterns, examination guidelines, and academic standards.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Python ML Processing
            </span>
            <span className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Syllabus Alignment
            </span>
            <span className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Video Recommendations
            </span>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Course Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 h-fit sticky top-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">📚</span>
                  </div>
                  <h3 className="text-2xl font-bold">Course Selection</h3>
                </div>

                <div className="space-y-6">
                  {/* Scheme Selection */}
                  <div className="space-y-3">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
                      🎓 VTU Scheme
                    </label>
                    <select
                      value={scheme}
                      onChange={(e) => setScheme(e.target.value)}
                      className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 font-medium"
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
                  <div className="space-y-3">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
                      ⚙️ Engineering Branch
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      disabled={!scheme}
                      className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 font-medium"
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
                  <div className="space-y-3">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
                      📅 Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      disabled={!scheme || !branch}
                      className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 font-medium"
                    >
                      <option value="">Choose Semester</option>
                      {availableSemesters.map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Selection */}
                  <div className="space-y-3">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
                      📖 Subject
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      disabled={!scheme || !semester || !branch || availableSubjects.length === 0}
                      className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 font-medium"
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
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-700/50 mt-6">
                      <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
                        📚 {selectedSubjectData.name}
                      </h4>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        Code: {selectedSubjectData.code}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {selectedSubjectData.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Question & Answer */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                
                {/* Question Input */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold">🤖</span>
                    </div>
                    <h3 className="text-2xl font-bold">Ask Your Question</h3>
                  </div>

                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={selectedSubjectData ? 
                      `Ask your VTU question about ${selectedSubjectData.name}. Our Python ML models will process it according to VTU syllabus guidelines...` :
                      "Please select your course details first to enable Python ML-powered question processing..."
                    }
                    className="w-full px-6 py-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none text-lg leading-relaxed"
                    rows={8}
                  />

                  {/* Error Display */}
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-700/50">
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full mt-6 flex items-center justify-center gap-3 py-5 px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing with Python ML...
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">🚀</span>
                        Get ML-Enhanced Answer
                      </>
                    )}
                  </button>
                </div>

                {/* Loading Animation */}
                {loading && !answer && (
                  <div className="flex flex-col items-center justify-center gap-6 rounded-2xl p-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                    <div className="flex items-center gap-4">
                      <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <div className="text-lg font-medium text-blue-600 dark:text-blue-400">
                        Python ML Processing...
                      </div>
                    </div>
                    <div className="text-center text-gray-600 dark:text-gray-400">
                      <p className="font-medium">Analyzing question with custom trained models</p>
                      <p className="text-sm mt-1">Generating VTU syllabus-aligned response</p>
                    </div>
                  </div>
                )}

                {/* Answer Display */}
                {answer && (
                  <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-3xl shadow-lg border border-green-200 dark:border-green-700/50">
                    <div className="p-6 border-b border-green-200 dark:border-green-700/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl shadow-lg">
                          <span className="text-2xl font-bold text-white">E</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-green-800 dark:text-green-200">VTU EduMate Response</h3>
                          <p className="text-sm text-green-600 dark:text-green-400">Custom GPT • Python ML • Research-Grade</p>
                        </div>
                      </div>
                      
                      {/* ML Analysis Display */}
                      {mlAnalysis && (
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                            {(mlAnalysis.confidence * 100).toFixed(1)}% Confidence
                          </span>
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium">
                            {mlAnalysis.complexityLevel.toUpperCase()}
                          </span>
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium">
                            {mlAnalysis.recommendedMarks} Marks
                          </span>
                        </div>
                      )}
                      
                      {showMarksOptions && (
                        <div className="flex items-center gap-3">
                          {[2, 5, 10].map(marks => (
                            <button
                              key={marks}
                              onClick={() => handleMarksAdjustment(marks)}
                              disabled={loading}
                              className="px-4 py-2 text-sm font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 disabled:opacity-50 border-2 border-blue-200 dark:border-blue-800"
                            >
                              {marks} Marks
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div
                      className="prose prose-lg dark:prose-invert max-w-none p-8 text-gray-800 dark:text-gray-200"
                      dangerouslySetInnerHTML={{ __html: answer.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                    />
                    
                    {/* Video Recommendations */}
                    {videoRecommendations.length > 0 && (
                      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                          🎥 ML-Recommended Videos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {videoRecommendations.map((video, index) => (
                            <a
                              key={index}
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group"
                            >
                              <h5 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                                {video.title}
                              </h5>
                              <div className="mt-2 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                                <span>{(video.relevance * 100).toFixed(0)}% relevant</span>
                                <span>{video.duration}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-800/20 rounded-b-3xl border-t border-gray-200 dark:border-gray-700/50">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-2">
                          <span>🎓</span>
                          VTU {scheme} Scheme
                        </span>
                        <span className="flex items-center gap-2">
                          <span>📚</span>
                          {selectedSubjectData?.name}
                        </span>
                        <span className="flex items-center gap-2">
                          <span>🐍</span>
                          Python ML
                        </span>
                        <span className="flex items-center gap-2">
                          <span>⭐</span>
                          Research-Grade
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

      {/* Footer */}
      <footer className="text-center py-12 mt-20 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VTU EduMate
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Custom GPT • Python ML Models • Research-Grade VTU Assistant
          </p>
        </div>
      </footer>
    </div>
  );
}
