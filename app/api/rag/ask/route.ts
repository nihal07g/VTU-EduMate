/**
 * RAG Ask API Route for VTU EduMate
 * 
 * POST /api/rag/ask
 * 
 * This is a server-side API route that implements the RAG (Retrieval-Augmented Generation) pipeline:
 * 1. Validates input
 * 2. Retrieves relevant chunks from vector index
 * 3. Builds prompt with context
 * 4. Generates answer using Gemini
 * 5. Returns structured response with citations
 * 
 * SECURITY: All external API calls (embeddings, Gemini) are server-side only.
 * No API keys are exposed to client-side code.
 * 
 * REQUIRES:
 * - GEMINI_API_KEY (server-side)
 * - RAG index must be built (run ingest script first)
 * 
 * Request body:
 * {
 *   "question": string,
 *   "scheme"?: string,
 *   "subject"?: string,
 *   "useRag"?: boolean
 * }
 * 
 * Response:
 * {
 *   "answer": string,
 *   "citations": Array<{source, page, chunk_id}>,
 *   "sources": Array<metadata>,
 *   "debug": {scores, retrieval_confidence, search_time_ms}
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { retrieve } from '../../../../lib/rag/retriever';
import { buildPrompt } from '../../../../lib/rag/prompt_builder';
import { generateStructuredResponse } from '../../../../lib/rag/gemini_client';
import { getAiResponse } from '../../../../lib/client-actions'; // Fallback to existing system

const ENABLE_RAG = process.env.ENABLE_RAG === 'true';

interface RagRequest {
  question: string;
  scheme?: string;
  subject?: string;
  useRag?: boolean;
  filters?: {
    source?: string;
    unit?: string;
    minScore?: number;
  };
}

interface RagResponse {
  answer: string;
  citations: Array<{
    source: string;
    page?: number;
    chunk_id: string;
  }>;
  sources: Array<any>;
  debug?: {
    scores: number[];
    retrieval_confidence: boolean;
    search_time_ms: number;
    total_chunks: number;
    method: 'rag' | 'heuristic_fallback';
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<RagResponse>> {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body: RagRequest = await request.json();
    
    console.log('🎯 RAG Ask API called:', {
      question: body.question?.substring(0, 50) + '...',
      useRag: body.useRag,
      enableRag: ENABLE_RAG,
      scheme: body.scheme,
      subject: body.subject
    });
    
    // Validate input
    const validation = validateRequest(body);
    if (validation.error) {
      return NextResponse.json({
        answer: validation.error,
        citations: [],
        sources: [],
        error: validation.error
      }, { status: 400 });
    }
    
    // Determine if RAG should be used
    const shouldUseRag = body.useRag === true || ENABLE_RAG;
    
    if (!shouldUseRag) {
      console.log('🔄 RAG disabled, using existing heuristic system');
      return await handleHeuristicFallback(body);
    }
    
    // Use RAG pipeline
    try {
      return await handleRagPipeline(body, startTime);
    } catch (ragError) {
      console.error('❌ RAG pipeline failed:', ragError);
      console.log('🔄 Falling back to heuristic system');
      return await handleHeuristicFallback(body, ragError);
    }
    
  } catch (error) {
    console.error('❌ RAG API error:', error);
    
    return NextResponse.json({
      answer: 'An error occurred while processing your question. Please try again.',
      citations: [],
      sources: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Validate request input
 */
function validateRequest(body: RagRequest): { error?: string } {
  if (!body.question || typeof body.question !== 'string') {
    return { error: 'Question is required and must be a string' };
  }
  
  if (body.question.trim().length === 0) {
    return { error: 'Question cannot be empty' };
  }
  
  if (body.question.length > 2000) {
    return { error: 'Question is too long (max 2000 characters)' };
  }
  
  return {};
}

/**
 * Handle RAG pipeline
 */
async function handleRagPipeline(body: RagRequest, startTime: number): Promise<NextResponse<RagResponse>> {
  console.log('🚀 Starting RAG pipeline...');
  
  // Step 1: Retrieve relevant chunks
  console.log('🔍 Step 1: Retrieving relevant chunks...');
  const retrievalResult = await retrieve(body.question);
  
  if (!retrievalResult.confidence) {
    console.log('⚠️ Low retrieval confidence, returning "not found" response');
    return NextResponse.json({
      answer: 'Not found in VTU context.',
      citations: [],
      sources: [],
      debug: {
        scores: retrievalResult.results.map(r => r.score),
        retrieval_confidence: false,
        search_time_ms: retrievalResult.metadata.search_time_ms,
        total_chunks: retrievalResult.metadata.total_chunks,
        method: 'rag'
      }
    });
  }
  
  console.log(`✅ Retrieved ${retrievalResult.results.length} relevant chunks`);
  
  // Step 2: Build prompt with context
  console.log('📝 Step 2: Building prompt...');
  const promptData = buildPrompt(retrievalResult.results, body.question, {
    answerFormat: 'exam',
    citationStyle: 'vtu',
    includeMetadata: true
  });
  
  console.log(`📊 Prompt built: ~${promptData.tokenEstimate} tokens`);
  
  // Step 3: Generate response using Gemini
  console.log('🤖 Step 3: Generating response...');
  const geminiResponse = await generateStructuredResponse(
    promptData.fullPrompt,
    ['answer', 'citations', 'exam_format']
  );
  
  // Step 4: Process and format response
  const processedResponse = processGeminiResponse(geminiResponse, retrievalResult.results);
  
  const totalTime = Date.now() - startTime;
  console.log(`✅ RAG pipeline completed in ${totalTime}ms`);
  
  return NextResponse.json({
    ...processedResponse,
    debug: {
      scores: retrievalResult.results.map(r => r.score),
      retrieval_confidence: retrievalResult.confidence,
      search_time_ms: retrievalResult.metadata.search_time_ms,
      total_chunks: retrievalResult.metadata.total_chunks,
      method: 'rag'
    }
  });
}

/**
 * Process Gemini response and map citations
 */
function processGeminiResponse(geminiResponse: any, retrievedChunks: any[]): Omit<RagResponse, 'debug'> {
  const answer = geminiResponse.answer || 'No answer generated';
  const rawCitations = geminiResponse.citations || [];
  
  // Map citations to actual retrieved chunks
  const citations = rawCitations.map((citation: any) => {
    // Try to match citation to retrieved chunks
    const matchedChunk = retrievedChunks.find(chunk => 
      chunk.metadata.source === citation.source ||
      chunk.metadata.chunk_id === citation.chunk_id
    );
    
    return {
      source: citation.source || matchedChunk?.metadata.source || 'Unknown',
      page: citation.page || matchedChunk?.metadata.page,
      chunk_id: citation.chunk_id || matchedChunk?.metadata.chunk_id || 'unknown'
    };
  });
  
  // Extract unique sources for metadata
  const sources = retrievedChunks.map(chunk => ({
    source: chunk.metadata.source,
    page: chunk.metadata.page,
    unit: chunk.metadata.unit,
    chunk_id: chunk.metadata.chunk_id,
    score: chunk.score
  }));
  
  return {
    answer,
    citations,
    sources
  };
}

/**
 * Handle fallback to existing heuristic system
 */
async function handleHeuristicFallback(body: RagRequest, ragError?: any): Promise<NextResponse<RagResponse>> {
  try {
    console.log('🔄 Using heuristic fallback system...');
    
    // Call existing VTU EduMate system
    const heuristicResponse = await getAiResponse(
      body.question,
      body.scheme || '2022', // Default scheme
      '5', // Default semester
      'CSE', // Default branch  
      'CS101', // Default subject code
      'Computer Science' // Default subject name
    );
    
    if (heuristicResponse.success) {
      return NextResponse.json({
        answer: heuristicResponse.answer,
        citations: [], // Heuristic system doesn't provide citations
        sources: [],
        debug: {
          scores: [],
          retrieval_confidence: true, // Assume confidence for heuristic
          search_time_ms: 0,
          total_chunks: 0,
          method: 'heuristic_fallback'
        }
      });
    } else {
      throw new Error(heuristicResponse.error || 'Heuristic system failed');
    }
    
  } catch (fallbackError) {
    console.error('❌ Heuristic fallback also failed:', fallbackError);
    
    return NextResponse.json({
      answer: 'Sorry, I encountered an error while processing your question. Please try again later.',
      citations: [],
      sources: [],
      error: `RAG failed: ${ragError?.message || 'Unknown RAG error'}. Fallback failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'}`,
      debug: {
        scores: [],
        retrieval_confidence: false,
        search_time_ms: 0,
        total_chunks: 0,
        method: 'heuristic_fallback'
      }
    }, { status: 500 });
  }
}

/**
 * Handle GET requests (API info)
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: 'VTU EduMate RAG API',
    version: '1.0.0',
    description: 'Retrieval-Augmented Generation API for VTU educational content',
    endpoints: {
      'POST /api/rag/ask': 'Ask questions using RAG pipeline'
    },
    configuration: {
      rag_enabled: ENABLE_RAG,
      requires_api_key: true
    },
    usage: {
      'POST /api/rag/ask': {
        body: {
          question: 'string (required)',
          scheme: 'string (optional)',
          subject: 'string (optional)',
          useRag: 'boolean (optional, forces RAG usage)'
        },
        response: {
          answer: 'string',
          citations: 'array',
          sources: 'array',
          debug: 'object'
        }
      }
    }
  });
}