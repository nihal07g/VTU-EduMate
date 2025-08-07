// Client-side actions for static deployment
// This replaces server actions for static export

import { smartGeminiClient } from '../lib/smart-gemini-client';
import { generateVTUAnswer } from '../lib/gemini-2-flash';
import { testGeminiAPI } from '../lib/gemini-diagnostics';
import { formatChatGPTStyle, formatMarksSpecific } from '../lib/answer-formatter';

export async function getAiResponse(
  question: string, 
  scheme: string, 
  semester: string, 
  branch: string,
  subjectCode: string,
  subjectName: string
) {
  console.log('🎓 VTU EduMate Request:', {
    question: question.substring(0, 50) + '...',
    scheme, semester, branch, subjectCode
  });

  // Validation
  if (!question || !scheme || !semester || !branch || !subjectCode || !subjectName) {
    const missing = [];
    if (!question) missing.push('question');
    if (!scheme) missing.push('scheme'); 
    if (!semester) missing.push('semester');
    if (!branch) missing.push('branch');
    if (!subjectCode) missing.push('subject code');
    if (!subjectName) missing.push('subject name');
    
    return {
      success: false,
      error: `Missing: ${missing.join(', ')}`,
      answer: `Welcome to VTU EduMate! 🎓 I'm your AI assistant for VTU syllabus. Please select ${missing.join(', ')} to get started with intelligent, syllabus-aligned answers.`
    };
  }

  try {
    // Generate simple prompt for static deployment
    const prompt = `As a VTU (Visvesvaraya Technological University) educational assistant, answer this question for ${scheme} scheme, ${semester} semester, ${branch} branch, subject: ${subjectName} (${subjectCode}).

Question: ${question}

Please provide a comprehensive answer following VTU examination standards with proper formatting, examples, and technical details appropriate for university-level understanding.`;

    const result = await generateVTUAnswer(prompt);

    if (!result || result.length === 0) {
      return {
        success: false,
        error: 'No response generated',
        answer: `VTU EduMate could not generate a response. Please try again.`
      };
    }

    // Format response
    const enhancedAnswer = formatChatGPTStyle(
      result,
      subjectName,
      subjectCode,
      scheme,
      semester,
      branch
    );

    return {
      success: true,
      answer: enhancedAnswer,
      prompt: prompt,
      subject: subjectName,
      subjectCode: subjectCode,
      scheme: scheme,
      semester: semester,
      branch: branch,
      cached: false,
      awaitingMarks: true,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ VTU EduMate Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      answer: `VTU EduMate encountered an error while processing your question about **${subjectName}**. 🤖\n\nPlease try rephrasing your question or check your connection.`
    };
  }
}

export async function getMarkedAnswer(
    input: {
    prompt: string;
    marks: number;
    question: string;
  }
) {
  try {
    const marksPrompt = `Reformat this VTU examination answer specifically for ${input.marks} marks format:

**📝 Original Question:** ${input.question}
**📄 Original Answer:** 
${input.prompt}

**⭐ Requirements for ${input.marks} marks format:**
${input.marks === 2 ? 
  `- **Concise Format (150-250 words)**
  - Brief definition with 2-3 key points
  - Focus on most essential concepts only
  - Direct, short answers suitable for 2-mark questions` : 
  input.marks === 5 ? 
  `- **Detailed Format (400-600 words)**
  - Comprehensive explanation with examples
  - Include diagrams/flowcharts descriptions where relevant
  - Cover main concepts with supporting technical details
  - Suitable for moderate-length VTU questions` :
  `- **Comprehensive Format (800-1200 words)**
  - Complete coverage with all aspects, examples, and applications
  - Include detailed explanations, multiple examples, comparisons
  - Cover all related concepts thoroughly with practical applications
  - Full VTU examination-style comprehensive answer`
}

**🎯 Provide the ${input.marks} marks formatted answer with proper VTU examination structure and technical depth:**`;

    const reformattedAnswer = await generateVTUAnswer(marksPrompt);
    const formattedAnswer = formatMarksSpecific(reformattedAnswer, String(input.marks));

    return {
      success: true,
      answer: formattedAnswer
    };
  } catch (error) {
    console.error('❌ Marks adjustment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      error: `Failed to adjust answer format for ${input.marks} marks: ${errorMessage}`,
      answer: `❌ **Format Adjustment Error**\n\nUnable to reformat answer for ${input.marks} marks. Please try again.`
    };
  }
}

export async function runGeminiDiagnostics() {
  console.log('🔍 Running Gemini API diagnostics...');
  
  const testResult = await testGeminiAPI();
  
  const report = {
    timestamp: new Date().toISOString(),
    api_status: testResult.status,
    model_tested: testResult.model,
    response_time_ms: testResult.response_time,
    error_details: testResult.error_message || null,
    sample_response: testResult.response_sample || null,
    recommendations: [] as string[]
  };

  // Add recommendations based on test results
  if (testResult.status === 'success') {
    report.recommendations.push('✅ Gemini API is working correctly');
    report.recommendations.push('🚀 Enhanced with Gemini 2.0 Flash');
    report.recommendations.push('📈 Improved response quality');
  } else {
    report.recommendations.push('❌ Gemini API connection failed');
    report.recommendations.push('🔑 Check GEMINI_API_KEY environment variable');
    report.recommendations.push('🌐 Verify internet connectivity');
    report.recommendations.push('💳 Check API quota and billing status');
  }

  return report;
}
