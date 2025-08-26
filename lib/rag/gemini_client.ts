/**
 * Server-side Gemini Client for VTU EduMate RAG
 * 
 * SECURITY: This module handles all Gemini API communication server-side only.
 * NEVER expose GEMINI_API_KEY to client-side code or commit to version control.
 * 
 * REQUIRES:
 * - GEMINI_API_KEY: Google AI Studio API key (server-side only)
 * - GEN_MODEL: Primary generation model (default: gemini-2.0-flash-exp)
 * - GEN_MODEL_FALLBACK: Fallback model (default: gemini-1.5-flash-latest)
 * 
 * Features:
 * - Exponential backoff retry mechanism
 * - Automatic model fallback on persistent failures
 * - Structured JSON response parsing
 * - Error handling and logging
 * - Rate limiting consideration
 * 
 * Production scaling notes:
 * - Implement connection pooling for high throughput
 * - Add response caching for repeated queries
 * - Monitor API usage and costs
 * - Consider request batching where possible
 * - Add circuit breaker pattern for resilience
 */

interface GeminiRequest {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason?: string;
    index?: number;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

interface GenerationConfig {
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
  responseFormat: 'text' | 'json';
}

// Environment configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEN_MODEL = process.env.GEN_MODEL || 'gemini-2.0-flash-exp';
const GEN_MODEL_FALLBACK = process.env.GEN_MODEL_FALLBACK || 'gemini-1.5-flash-latest';

// Default generation configuration
const DEFAULT_CONFIG: GenerationConfig = {
  temperature: 0.1, // Low temperature for factual, consistent answers
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
  responseFormat: 'json'
};

/**
 * Generate response from prompt using Gemini API
 */
export async function generateFromPrompt(
  prompt: string,
  config: Partial<GenerationConfig> = {}
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required for RAG functionality');
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  console.log(`🤖 Generating response using ${GEN_MODEL}`);
  console.log(`⚙️ Config: temp=${finalConfig.temperature}, format=${finalConfig.responseFormat}`);
  
  try {
    // Try primary model first
    const response = await generateWithModel(GEN_MODEL, prompt, finalConfig);
    console.log('✅ Primary model succeeded');
    return response;
    
  } catch (primaryError) {
    console.warn(`⚠️ Primary model (${GEN_MODEL}) failed:`, primaryError);
    
    try {
      // Fallback to secondary model
      console.log(`🔄 Attempting fallback model: ${GEN_MODEL_FALLBACK}`);
      const response = await generateWithModel(GEN_MODEL_FALLBACK, prompt, finalConfig);
      console.log('✅ Fallback model succeeded');
      return response;
      
    } catch (fallbackError) {
      console.error(`❌ Both models failed. Primary: ${primaryError}, Fallback: ${fallbackError}`);
      throw new Error(`Generation failed: ${fallbackError}`);
    }
  }
}

/**
 * Generate response using specific model with retry logic
 */
async function generateWithModel(
  model: string,
  prompt: string,
  config: GenerationConfig,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} with model ${model}`);
      
      const response = await callGeminiAPI(model, prompt, config);
      return response;
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError || new Error('Maximum retry attempts exceeded');
}

/**
 * Make actual API call to Gemini
 */
async function callGeminiAPI(
  model: string,
  prompt: string,
  config: GenerationConfig
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const requestBody: GeminiRequest = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: config.temperature,
      topK: config.topK,
      topP: config.topP,
      maxOutputTokens: config.maxOutputTokens,
      responseMimeType: config.responseFormat === 'json' ? 'application/json' : 'text/plain'
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH'
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data: GeminiResponse = await response.json();
  
  // Validate response structure
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No candidates returned from Gemini API');
  }
  
  const candidate = data.candidates[0];
  
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error('Invalid candidate structure in Gemini response');
  }
  
  // Check for safety issues
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Response blocked by safety filters');
  }
  
  const generatedText = candidate.content.parts[0].text;
  
  if (!generatedText || generatedText.trim().length === 0) {
    throw new Error('Empty response from Gemini API');
  }
  
  return generatedText.trim();
}

/**
 * Parse and validate JSON response from Gemini
 */
export async function generateStructuredResponse(
  prompt: string,
  expectedKeys: string[] = ['answer', 'citations', 'exam_format']
): Promise<object> {
  const response = await generateFromPrompt(prompt, { responseFormat: 'json' });
  
  try {
    const parsed = JSON.parse(response);
    
    // Validate expected keys are present
    const missingKeys = expectedKeys.filter(key => !(key in parsed));
    if (missingKeys.length > 0) {
      console.warn(`⚠️ Missing expected keys in response: ${missingKeys.join(', ')}`);
      
      // Provide defaults for missing keys
      const defaults: Record<string, any> = {
        answer: response, // Use raw response as fallback
        citations: [],
        exam_format: 'six_mark'
      };
      
      for (const key of missingKeys) {
        parsed[key] = defaults[key] || null;
      }
    }
    
    return parsed;
    
  } catch (parseError) {
    console.warn('⚠️ Failed to parse JSON response, returning wrapped text');
    
    // Fallback: wrap text response in expected structure
    return {
      answer: response,
      citations: [],
      exam_format: 'six_mark',
      _parsing_error: true
    };
  }
}

/**
 * Test Gemini API connectivity and configuration
 */
export async function testGeminiConnection(): Promise<object> {
  if (!GEMINI_API_KEY) {
    return {
      status: 'error',
      error: 'GEMINI_API_KEY not configured'
    };
  }
  
  try {
    const startTime = Date.now();
    
    const testPrompt = 'Respond with a JSON object containing a "status" field set to "ok" and a "message" field with a brief greeting.';
    const response = await generateFromPrompt(testPrompt, { responseFormat: 'json' });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      status: 'success',
      model: GEN_MODEL,
      fallback_model: GEN_MODEL_FALLBACK,
      response_time_ms: responseTime,
      response_sample: response.substring(0, 100)
    };
    
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      model: GEN_MODEL
    };
  }
}

/**
 * Get current API configuration
 */
export function getGeminiConfig(): object {
  return {
    has_api_key: !!GEMINI_API_KEY,
    primary_model: GEN_MODEL,
    fallback_model: GEN_MODEL_FALLBACK,
    default_config: DEFAULT_CONFIG
  };
}