// Smart Gemini Client for VTU EduMate
// JavaScript version - no TypeScript interfaces

class SmartGeminiClient {
  constructor() {
    this.cache = new Map();
    this.usage = {
      daily_requests: 0,
      last_reset: new Date().toDateString(),
      remaining_quota: 50 // Conservative free tier limit
    };
  }

  // Generate hash for question to enable caching
  hashQuestion(question, context) {
    // Simple hash function for client-side demo; for production, use a cryptographic hash on the server.
    const str = question + context;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return 'h' + Math.abs(hash).toString(16);
  }

  // Check and update daily usage
  checkUsage() {
    const today = new Date().toDateString();
    
    if (this.usage.last_reset !== today) {
      // Reset daily counter
      this.usage.daily_requests = 0;
      this.usage.last_reset = today;
      this.usage.remaining_quota = 50;
    }

    return this.usage.remaining_quota > 0;
  }

  // Check cache first to avoid API calls
  checkCache(questionHash) {
    const cached = this.cache.get(questionHash);
    
    if (cached) {
      const cacheAge = Date.now() - cached.timestamp;
      const cacheLimit = parseInt(process.env.GEMINI_CACHE_DURATION || '3600') * 1000;
      
      if (cacheAge < cacheLimit) {
        console.log(`✅ Cache hit for ${questionHash}`);
        return cached.answer;
      } else {
        // Cache expired
        this.cache.delete(questionHash);
        console.log(`- Cache expired for ${questionHash}`);
      }
    }
    return null;
  }

  // Optimize prompt for token efficiency
  optimizePrompt(question, subject, subjectCode, scheme, semester, branch) {
    return `You are a helpful VTU exam assistant. A ${branch} engineering student in semester ${semester} is asking about ${subject} (${subjectCode}) from the ${scheme} scheme.

Question: "${question}"

Please provide a clear, engaging answer that:
- Explains concepts in simple, understandable terms
- Uses examples and analogies where helpful
- Structures information with proper headings and bullet points
- Focuses on what students need to know for VTU exams
- Maintains a friendly, educational tone like ChatGPT

Make your response conversational but informative, perfect for exam preparation.`;
  }
  
  async generateVTUAnswer(question, subject, subjectCode, scheme, semester, branch) {
    
    // Create context for caching
    const context = `${scheme}-${semester}-${branch}-${subjectCode}`;
    const questionHash = this.hashQuestion(question, context);
    
    // Check cache first
    const cachedAnswer = this.checkCache(questionHash);
    if (cachedAnswer) {
      return {
        success: true,
        answer: cachedAnswer,
        cached: true,
        usage_info: { 
          api_calls_saved: 1,
          remaining_quota: this.usage.remaining_quota 
        }
      };
    }

    // Check usage limits
    if (!this.checkUsage()) {
      return {
        success: false,
        answer: `🚫 **Daily API Limit Reached**\n\nYou've reached the free tier limit of ${this.usage.daily_requests} requests today.\n\n**Options:**\n- Wait until tomorrow for quota reset\n- Use cached responses for similar questions\n- Upgrade to paid tier for unlimited access`,
        usage_info: { 
          daily_requests: this.usage.daily_requests,
          remaining_quota: 0 
        }
      };
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    try {
      // Optimized prompt for token efficiency
      const optimizedPrompt = this.optimizePrompt(question, subject, subjectCode, scheme, semester, branch);

      console.log(`🚀 API Call ${this.usage.daily_requests + 1}/50 - Quota remaining: ${this.usage.remaining_quota - 1}`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: optimizedPrompt }] }],
            generationConfig: {
              temperature: 0.6,
              topK: 32,
              topP: 0.8,
              maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1024'), // Conservative token limit
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }

      const answer = data.candidates[0].content.parts[0].text;

      // Update usage tracking
      this.usage.daily_requests += 1;
      this.usage.remaining_quota -= 1;

      // Cache the response
      this.cache.set(questionHash, {
        answer,
        timestamp: Date.now(),
        question_hash: questionHash
      });

      return {
        success: true,
        answer: answer,
        cached: false,
        prompt: optimizedPrompt,
        usage_info: {
          daily_requests: this.usage.daily_requests,
          remaining_quota: this.usage.remaining_quota,
          cache_size: this.cache.size
        }
      };

    } catch (error) {
      console.error('❌ Smart Gemini API error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate answer: ${error.message}`);
      }
      throw new Error('An unknown error occurred during answer generation.');
    }
  }

  // Get usage statistics
  getUsageStats() {
    return {
      daily_requests: this.usage.daily_requests,
      remaining_quota: this.usage.remaining_quota,
      cache_size: this.cache.size,
      last_reset: this.usage.last_reset
    };
  }

  // Clear cache manually if needed
  clearCache() {
    this.cache.clear();
    console.log('✅ Cache cleared');
  }
}

export const smartGeminiClient = new SmartGeminiClient();
