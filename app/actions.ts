'use server'

import { smartGeminiClient } from '../lib/smart-gemini-client';
import { generateVTUAnswer } from '../lib/gemini-2-flash';
import { testGeminiAPI } from '../lib/gemini-diagnostics';
import { formatChatGPTStyle, formatMarksSpecific } from '../lib/answer-formatter';
import { researchGradeMLProcessor } from '../lib/research-ml-processor';

export async function getAiResponse(
  question: string, 
  scheme: string, 
  semester: string, 
  branch: string,
  subjectCode: string,
  subjectName: string
) {
  console.log('🎓 VTU EduMate ML-Enhanced Request:', {
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
      answer: `Welcome to VTU EduMate! 🎓 I'm your custom GPT assistant trained on VTU syllabus. Please select ${missing.join(', ')} to get started with intelligent, syllabus-aligned answers.`
    };
  }

  try {
    // Step 1: ML Processing - Custom VTU question analysis
    console.log('🤖 Processing question through VTU ML model...');
    const mlResult = await researchGradeMLProcessor.processQuestion(question.trim(), {
      scheme,
      semester,
      branch,
      branchName: branch, // Using branch as branchName for now
      subjectCode,
      subjectName
    });

    // Step 2: Generate YouTube recommendations
    // Video recommendations will be added later
    // const videoRecommendations = await vtuMLProcessor.getVideoRecommendations(
    //   question.trim(),
    //   {
    //     scheme,
    //     semester,
    //     branch,
    //     branchName: branch,
    //     subjectCode,
    //     subjectName
    //   }
    // );

    // Step 3: Enhanced Gemini API call with ML preprocessing
    // Step 3: Generate optimized prompt using research-grade ML
    const optimizedPrompt = researchGradeMLProcessor.generateVTUOptimizedPrompt(
      question.trim(),
      {
        scheme,
        semester,
        branch,
        branchName: branch,
        subjectCode,
        subjectName
      },
      mlResult
    );

    const result = await generateVTUAnswer(optimizedPrompt);

    if (!result || result.length === 0) {
      return {
        success: false,
        error: 'No response generated',
        answer: `VTU EduMate could not generate a response. Please try again.`
      };
    }

    // Step 4: Format response with ML insights and video recommendations
    const enhancedAnswer = `${formatChatGPTStyle(
      result,
      subjectName,
      subjectCode,
      scheme,
      semester,
      branch
    )}

---

## 🤖 Research-Grade ML Analysis
- **Model Version**: ${mlResult.mlMetadata.modelVersion}
- **Confidence Score**: ${(mlResult.confidence * 100).toFixed(1)}%
- **Complexity Level**: ${mlResult.complexityLevel.toUpperCase()}
- **Recommended Marks**: ${mlResult.recommendedMarks}
- **Topic Category**: ${mlResult.topicCategory}
- **Processing Time**: ${mlResult.mlMetadata.processingTime}
- **Algorithms Used**: ${mlResult.mlMetadata.algorithms.join(', ')}

## 📚 Academic Insights
- **Difficulty Score**: ${mlResult.academicInsights.difficultyScore}/100
- **Learning Path**: ${mlResult.academicInsights.learningPath}
- **Estimated Study Time**: ${mlResult.academicInsights.estimatedStudyTime}

## 🎥 Recommended Learning Videos
${mlResult.videoRecommendations.map((video, index) => 
  `${index + 1}. **[${video.title}](${video.url})**
   - Duration: ${video.duration} | Difficulty: ${video.difficulty}
   - ${video.description}`
).join('\n\n')}

- **Syllabus Alignment**: ${mlResult.syllabusTags.slice(0, 3).join(', ')}

_VTU EduMate - Powered by Custom Python ML Models_`;

    return {
      success: true,
      answer: enhancedAnswer,
      prompt: optimizedPrompt,
      subject: subjectName,
      subjectCode: subjectCode,
      scheme: scheme,
      semester: semester,
      branch: branch,
      cached: false,
      awaitingMarks: true,
      mlAnalysis: mlResult,
      videoRecommendations: mlResult.videoRecommendations,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ VTU EduMate ML Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      answer: `VTU EduMate encountered an error while processing your question about **${subjectName}**. 🤖\n\nOur custom ML model is designed for VTU syllabus analysis. Please try rephrasing your question or check your connection.`
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
  console.log('🔍 Running comprehensive Gemini API diagnostics...');
  
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
    report.recommendations.push('🚀 Upgraded to Gemini 2.0 Flash for better performance');
    report.recommendations.push('📈 Enhanced token limits and improved response quality');
  } else {
    report.recommendations.push('❌ Gemini API connection failed');
    report.recommendations.push('🔑 Check GEMINI_API_KEY environment variable');
    report.recommendations.push('🌐 Verify internet connectivity');
    report.recommendations.push('💳 Check API quota and billing status');
  }

  return report;
}
