interface Gemini2Response {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// Utility function for exponential backoff retry
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
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
  
  throw lastError!;
}

export async function generateVTUAnswer(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  console.log('🚀 Using Gemini 2.0 Flash model for VTU answer generation...');

  const generateContent = async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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

    const data: Gemini2Response = await response.json();
    
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

    console.log('✅ Gemini 2.0 Flash response generated successfully');
    return generatedText;
  };

  try {
    return await retryWithBackoff(generateContent, 5, 2000);
  } catch (error) {
    console.error('❌ Gemini 2.0 Flash final error:', error);
    
    // Fallback to Gemini 1.5 Flash if 2.0 fails
    console.log('🔄 Trying fallback to Gemini 1.5 Flash...');
    
    try {
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
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
          console.log('✅ Fallback to Gemini 1.5 Flash successful');
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
