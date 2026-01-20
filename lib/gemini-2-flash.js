// Gemini2Response structure:
// {
//   candidates: Array<{
//     content: {
//       parts: Array<{
//         text: string
//       }>
//     },
//     finishReason: string
//   }>,
//   usageMetadata?: {
//     promptTokenCount: number,
//     candidatesTokenCount: number,
//     totalTokenCount: number
//   }
// }

// VideoRecommendation structure:
// {
//   title: string,
//   url: string,
//   channel: string,
//   duration: string,
//   relevance: number
// }

// Utility function for exponential backoff retry
async function retryWithBackoff(
  fn,
  maxRetries = 5,
  baseDelay = 1000
) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If it's not a 503 error, don't retry
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('503') && !errorMessage.includes('overloaded')) {
        throw error;
      }
      
      if (attempt === maxRetries - 1) {
        break; // Last attempt, don't delay
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} after ${delay.toFixed(0)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export async function generateVTUAnswer(prompt) {
  // Try both public and private environment variables for compatibility
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  console.log('🔍 Environment check:', {
    hasApiKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    nodeEnv: process.env.NODE_ENV,
    publicKeyExists: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    privateKeyExists: !!process.env.GEMINI_API_KEY
  });
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  console.log('🚀 Using Gemini 2.5 Flash model for VTU answer generation...');

  const generateContent = async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          },
          safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
        })
      }
    );

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error('❌ Gemini API Error Response:', errorData);
        errorMessage = errorData.error?.message || errorMessage;
        
        if (response.status === 503) {
          throw new Error(`503 - The model is overloaded. Please try again later.`);
        }
      } catch (parseError) {
        console.error('❌ Could not parse error response:', parseError);
      }
      
      throw new Error(`Gemini API error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response candidates generated from Gemini API');
    }

    if (!data.candidates[0].content?.parts?.[0]?.text) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response structure from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Log usage metadata if available
    if (data.usageMetadata) {
      console.log('📊 Token usage:', data.usageMetadata);
    }

    console.log('✅ Gemini 2.5 Flash response generated successfully');
    return generatedText;
  };

  try {
    return await retryWithBackoff(generateContent, 5, 2000);
  } catch (error) {
    console.error('❌ Gemini 2.5 Flash final error:', error);
    
    // Fallback to Gemini 1.5 Pro if primary fails
    console.log('🔄 Trying fallback to Gemini 1.5 Pro...');
    
    try {
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 8192,
              responseMimeType: "text/plain"
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          })
        }
      );

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.log('✅ Fallback to Gemini 1.5 Pro successful');
          return fallbackData.candidates[0].content.parts[0].text;
        }
      }
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
    
    if (error instanceof Error) {
      throw new Error(`Failed to generate VTU answer: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the VTU answer');
  }
}

export async function generateVideoRecommendations(
  question,
  subject = '',
  branch = '',
  semester = ''
) {
  try {
    // Generate search keywords from the question using AI
    const keywords = extractKeywordsFromQuestion(question, subject);
    
    // Create curated video recommendations based on common VTU topics
    const videoRecommendations = [
      // Engineering Mathematics videos
      {
        title: `${subject || 'Engineering'} - ${question.substring(0, 50)}... | Complete Tutorial`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(keywords.join(' ') + ' tutorial engineering')}`,
        channel: "Engineering Study Hub",
        duration: "15-25 min",
        relevance: calculateRelevance(question, keywords)
      },
      {
        title: `VTU ${subject || 'Engineering'} - Step by Step Solution | ${semester ? `Sem ${semester}` : 'University'}`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent('VTU ' + keywords.join(' ') + ' solution')}`,
        channel: "VTU Learning Hub",
        duration: "10-20 min",
        relevance: calculateRelevance(question, keywords) * 0.95
      },
      {
        title: `${keywords[0] || 'Engineering'} Concepts Explained | ${branch || 'Engineering'} Branch`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(keywords[0] + ' ' + branch + ' engineering concepts')}`,
        channel: "Engineering Concepts",
        duration: "20-30 min",
        relevance: calculateRelevance(question, keywords) * 0.9
      },
      {
        title: `${subject || 'Engineering'} Previous Year Questions & Solutions | VTU Exam Prep`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent('VTU ' + subject + ' previous year questions')}`,
        channel: "VTU Exam Prep",
        duration: "25-35 min",
        relevance: calculateRelevance(question, keywords) * 0.85
      },
      {
        title: `Complete ${keywords.slice(0, 2).join(' ')} Course | ${branch || 'Engineering'} Students`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(keywords.slice(0, 2).join(' ') + ' complete course ' + branch)}`,
        channel: "Engineering Academy",
        duration: "30-45 min",
        relevance: calculateRelevance(question, keywords) * 0.8
      }
    ];

    // Sort by relevance and return top 5
    return videoRecommendations
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
      
  } catch (error) {
    console.error('❌ Error generating video recommendations:', error);
    // Return default recommendations if generation fails
    return getDefaultVideoRecommendations(subject, branch);
  }
}

function extractKeywordsFromQuestion(question, subject) {
  // Common engineering keywords and their variations
  const engineeringKeywords = [
    'differential', 'integral', 'matrix', 'eigenvalue', 'fourier', 'laplace',
    'algorithm', 'data structure', 'programming', 'software', 'database',
    'circuit', 'electronics', 'digital', 'analog', 'signal', 'communication',
    'mechanics', 'thermodynamics', 'fluid', 'heat', 'transfer', 'design',
    'chemistry', 'organic', 'inorganic', 'physical', 'analysis',
    'english', 'communication', 'technical', 'writing', 'presentation'
  ];

  const words = question.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);

  // Extract relevant keywords
  const keywords = words.filter(word => 
    engineeringKeywords.some(keyword => 
      word.includes(keyword) || keyword.includes(word)
    )
  );

  // Add subject as primary keyword if provided
  if (subject) {
    keywords.unshift(subject.toLowerCase());
  }

  // Add some general words from the question
  const generalWords = words.filter(word => 
    !keywords.includes(word) && 
    word.length > 3 && 
    !['what', 'how', 'why', 'when', 'where', 'which', 'explain', 'describe', 'solve'].includes(word)
  ).slice(0, 3);

  return Array.from(new Set([...keywords, ...generalWords])).slice(0, 5);
}

function calculateRelevance(question, keywords) {
  const questionWords = question.toLowerCase().split(/\s+/);
  const matchingWords = keywords.filter(keyword => 
    questionWords.some(word => word.includes(keyword) || keyword.includes(word))
  );
  
  const baseRelevance = Math.min(matchingWords.length / keywords.length, 1);
  // Add some randomness to make it more realistic
  return Math.min(baseRelevance + (Math.random() * 0.2), 1);
}

function getDefaultVideoRecommendations(subject, branch) {
  return [
    {
      title: `${subject || 'Engineering'} Complete Course | ${branch || 'Engineering'} Tutorial`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent((subject || 'engineering') + ' tutorial')}`,
      channel: "Engineering Hub",
      duration: "20-30 min",
      relevance: 0.7
    },
    {
      title: `VTU ${subject || 'Engineering'} Previous Year Questions | Solved Examples`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent('VTU ' + (subject || 'engineering') + ' solved examples')}`,
      channel: "VTU Solutions",
      duration: "15-25 min",
      relevance: 0.65
    },
    {
      title: `${branch || 'Engineering'} Fundamentals | Basic Concepts Explained`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent((branch || 'engineering') + ' fundamentals')}`,
      channel: "Engineering Basics",
      duration: "25-35 min",
      relevance: 0.6
    },
    {
      title: `Engineering Mathematics | Essential Topics for ${branch || 'Engineering'}`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent('engineering mathematics ' + (branch || 'engineering'))}`,
      channel: "Math for Engineers",
      duration: "30-40 min",
      relevance: 0.55
    },
    {
      title: `${subject || 'Engineering'} Lab Experiments | Practical Implementation`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent((subject || 'engineering') + ' lab experiments')}`,
      channel: "Engineering Labs",
      duration: "20-30 min",
      relevance: 0.5
    }
  ];
}
