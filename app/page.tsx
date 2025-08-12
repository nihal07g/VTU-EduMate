'use client'

import React from 'react';
import Link from 'next/link';
import { ModeSelector } from '../components/mode-selector';
import dynamic from 'next/dynamic';

const ThemeToggle = dynamic(() => import('../components/theme-toggle'), { ssr: false });

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden shadow-lg">
              <img 
                src="/logo.png" 
                alt="VTU EduMate Logo" 
                className="w-12 h-12 object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                VTU EduMate
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI-Powered Study Assistant</p>
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
            Welcome to{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
              VTU EduMate
            </span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
            Your AI-powered educational assistant for Visvesvaraya Technological University. 
            Get intelligent answers, study resources, and academic support.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {/* VTU EduMate */}
          <Link href="/edumate" className="group">
            <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">VTU EduMate</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                AI-powered assistant trained on VTU syllabus. Get instant answers to your academic questions.
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:text-indigo-600">
                Start Learning
                <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* EduMate GPT */}
          <Link href="/edumate" className="group">
            <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg mb-6">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">EduMate GPT</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Advanced AI model for detailed academic explanations and research assistance.
              </p>
              <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold group-hover:text-pink-600">
                Explore Research
                <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Resources */}
          <Link href="/resources" className="group">
            <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg mb-6">
                <span className="text-3xl">📖</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Study Resources</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Access comprehensive study materials, notes, and resources for all VTU subjects.
              </p>
              <div className="flex items-center text-green-600 dark:text-green-400 font-semibold group-hover:text-teal-600">
                Browse Resources
                <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Features List */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl font-bold mb-12">Why Choose VTU EduMate?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-semibold mb-2">Instant Answers</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get immediate responses to your academic questions</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-semibold mb-2">VTU Focused</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Specifically trained on VTU syllabus and curriculum</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="font-semibold mb-2">Smart Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered analysis for better understanding</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🌙</span>
              </div>
              <h4 className="font-semibold mb-2">24/7 Available</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Study anytime with round-the-clock AI assistance</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Learning?</h3>
            <p className="text-xl mb-8 text-blue-100">Experience the power of AI-driven education for VTU students.</p>
            <Link href="/edumate" className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-colors duration-300 shadow-lg hover:shadow-xl">
              Get Started Now
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
