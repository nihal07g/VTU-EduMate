// ApiTestResult structure:
// {
//   status: 'success' | 'error',
//   model: string,
//   response_time: number,
//   error_message?: string,
//   response_sample?: string
// }

export async function testGeminiAPI() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const startTime = Date.now();
  
  console.log('🧪 Testing Gemini API connectivity...');
  
  if (!apiKey) {
    return {
      status: 'error',
      model: 'unknown',
      response_time: 0,
      error_message: 'GEMINI_API_KEY environment variable not found'
    };
  }

  try {
    const testPrompt = "Hello, this is a test. Please respond with 'API working correctly'.";
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100,
          }
        })
      }
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json();
      return {
        status: 'error',
        model: 'gemini-1.5-flash',
        response_time: responseTime,
        error_message: `HTTP ${response.status}: ${errorData.error?.message || 'Unknown API error'}`
      };
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      status: 'success',
      model: 'gemini-1.5-flash',
      response_time: responseTime,
      response_sample: responseText
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      status: 'error',
      model: 'gemini-1.5-flash',
      response_time: Date.now() - startTime,
      error_message: `Network/Connection error: ${errorMessage}`
    };
  }
}
