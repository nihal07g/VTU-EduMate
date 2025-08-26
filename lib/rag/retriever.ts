/**
 * RAG Retriever for VTU EduMate
 * 
 * Retrieves relevant document chunks based on semantic similarity to queries.
 * Supports configurable similarity thresholds and result counts.
 * 
 * Environment Variables:
 * - RAG_TOP_K: Number of top results to return (default: 5)
 * - RAG_MIN_SIM: Minimum similarity threshold for confidence (default: 0.25)
 * 
 * Production scaling notes:
 * - For large indices, consider approximate search (HNSW, IVF)
 * - Implement query expansion for better recall
 * - Add result re-ranking based on metadata (freshness, source quality)
 * - Consider hybrid search (semantic + keyword) for better coverage
 */

import { loadIndex, IndexedChunk, IndexData } from './indexer';
import { embedQuery, cosineSimilarity } from './embeddings';

const RAG_TOP_K = Number(process.env.RAG_TOP_K) || 5;
const RAG_MIN_SIM = Number(process.env.RAG_MIN_SIM) || 0.25;

export interface RetrievalResult {
  id: string;
  score: number;
  metadata: {
    source: string;
    page?: number;
    unit?: string;
    chunk_id: string;
    created_at: string;
  };
  text: string;
}

export interface RetrievalResponse {
  results: RetrievalResult[];
  confidence: boolean;
  query: string;
  metadata: {
    total_chunks: number;
    search_time_ms: number;
    top_k: number;
    min_similarity: number;
    average_score: number;
  };
}

/**
 * Retrieve relevant chunks for a given question
 */
export async function retrieve(
  question: string, 
  k: number = RAG_TOP_K
): Promise<RetrievalResponse> {
  const startTime = Date.now();
  
  console.log(`🔍 Retrieving top ${k} chunks for query: "${question.substring(0, 50)}..."`);
  
  // Load the index
  const indexData = await loadIndex();
  if (!indexData) {
    throw new Error('No RAG index found. Please run the ingestion script first.');
  }
  
  // Generate query embedding
  console.log('📊 Generating query embedding...');
  const queryEmbedding = await embedQuery(question);
  
  // Calculate similarities with all chunks
  console.log(`🧮 Calculating similarities with ${indexData.chunks.length} chunks...`);
  const similarities = indexData.chunks.map((chunk, index) => ({
    index,
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));
  
  // Sort by similarity score (descending)
  similarities.sort((a, b) => b.score - a.score);
  
  // Take top k results
  const topResults = similarities.slice(0, k);
  
  // Calculate average score for confidence assessment
  const averageScore = topResults.length > 0 
    ? topResults.reduce((sum, result) => sum + result.score, 0) / topResults.length 
    : 0;
  
  // Determine confidence based on average similarity
  const confidence = averageScore >= RAG_MIN_SIM;
  
  // Format results
  const results: RetrievalResult[] = topResults.map((result, rank) => ({
    id: result.chunk.id,
    score: result.score,
    metadata: result.chunk.metadata,
    text: result.chunk.text
  }));
  
  const searchTime = Date.now() - startTime;
  
  console.log(`✅ Retrieved ${results.length} chunks in ${searchTime}ms`);
  console.log(`📊 Average similarity: ${averageScore.toFixed(3)}, Confidence: ${confidence}`);
  
  if (results.length > 0) {
    console.log(`🏆 Top result: ${results[0].score.toFixed(3)} - ${results[0].metadata.source}`);
  }
  
  return {
    results,
    confidence,
    query: question,
    metadata: {
      total_chunks: indexData.chunks.length,
      search_time_ms: searchTime,
      top_k: k,
      min_similarity: RAG_MIN_SIM,
      average_score: averageScore
    }
  };
}

/**
 * Retrieve chunks filtered by metadata
 */
export async function retrieveFiltered(
  question: string,
  filters: {
    source?: string;
    unit?: string;
    minScore?: number;
  },
  k: number = RAG_TOP_K
): Promise<RetrievalResponse> {
  console.log('🔍 Retrieving with filters:', filters);
  
  // Get all results first
  const allResults = await retrieve(question, k * 2); // Get more to filter
  
  // Apply filters
  let filteredResults = allResults.results;
  
  if (filters.source) {
    filteredResults = filteredResults.filter(result => 
      result.metadata.source.toLowerCase().includes(filters.source!.toLowerCase())
    );
  }
  
  if (filters.unit) {
    filteredResults = filteredResults.filter(result => 
      result.metadata.unit?.toLowerCase() === filters.unit!.toLowerCase()
    );
  }
  
  if (filters.minScore !== undefined) {
    filteredResults = filteredResults.filter(result => 
      result.score >= filters.minScore!
    );
  }
  
  // Take top k after filtering
  filteredResults = filteredResults.slice(0, k);
  
  // Recalculate confidence and average score
  const averageScore = filteredResults.length > 0 
    ? filteredResults.reduce((sum, result) => sum + result.score, 0) / filteredResults.length 
    : 0;
  
  const confidence = averageScore >= RAG_MIN_SIM;
  
  console.log(`🎯 Filtered to ${filteredResults.length} chunks, confidence: ${confidence}`);
  
  return {
    ...allResults,
    results: filteredResults,
    confidence,
    metadata: {
      ...allResults.metadata,
      average_score: averageScore
    }
  };
}

/**
 * Get retrieval statistics and health check
 */
export async function getRetrievalStats(): Promise<object> {
  try {
    const indexData = await loadIndex();
    
    if (!indexData) {
      return {
        status: 'no_index',
        message: 'No RAG index found. Run ingestion script first.'
      };
    }
    
    // Test retrieval with a simple query
    const testStartTime = Date.now();
    const testResults = await retrieve('test query', 1);
    const testTime = Date.now() - testStartTime;
    
    return {
      status: 'ready',
      index_metadata: indexData.metadata,
      retrieval_config: {
        top_k: RAG_TOP_K,
        min_similarity: RAG_MIN_SIM
      },
      test_query: {
        time_ms: testTime,
        results_count: testResults.results.length,
        confidence: testResults.confidence
      }
    };
    
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Expand query with synonyms and related terms (for better recall)
 */
export function expandQuery(query: string): string[] {
  // Simple query expansion - in production, use more sophisticated methods
  const expansions = [query];
  
  // Add common VTU/CS synonyms
  const synonymMap: Record<string, string[]> = {
    'algorithm': ['algo', 'procedure', 'method'],
    'data structure': ['ds', 'data structures'],
    'operating system': ['os', 'operating systems'],
    'database': ['db', 'dbms', 'database management'],
    'network': ['networking', 'computer network'],
    'tree': ['binary tree', 'search tree'],
    'heap': ['priority queue', 'heap sort'],
    'process': ['threading', 'multithreading', 'concurrency']
  };
  
  const lowerQuery = query.toLowerCase();
  for (const [term, synonyms] of Object.entries(synonymMap)) {
    if (lowerQuery.includes(term)) {
      expansions.push(...synonyms.map(syn => 
        query.replace(new RegExp(term, 'gi'), syn)
      ));
    }
  }
  
  return Array.from(new Set(expansions)); // Remove duplicates
}