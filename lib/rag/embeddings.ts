/**
 * RAG Embeddings Service for VTU EduMate
 * 
 * REQUIRES: GEMINI_API_KEY (server-side only)
 * 
 * This module provides text embedding functionality using Google's Gemini text-embedding-004 model.
 * Falls back to deterministic hash-based embeddings when API key is not available (for CI/testing).
 * 
 * SECURITY: All API calls are server-side only. Never expose GEMINI_API_KEY to client-side code.
 * 
 * Production scaling notes:
 * - For high-volume production, consider caching embeddings
 * - Switch to dedicated embedding services (OpenAI, Cohere) if needed
 * - Implement batch embedding for large document sets
 * - Consider using local embedding models (sentence-transformers) for offline scenarios
 */

import crypto from 'crypto';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768; // Gemini text-embedding-004 dimension

interface EmbeddingResponse {
  embedding: {
    values: number[];
  };
}

/**
 * Generate embeddings for an array of texts using Gemini API
 * Falls back to deterministic hash embeddings if API key not available
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY not found, using deterministic fallback embeddings for testing');
    return texts.map(text => hashEmbed(text));
  }

  try {
    console.log(`📊 Generating embeddings for ${texts.length} texts using Gemini ${EMBEDDING_MODEL}`);
    
    const embeddings: number[][] = [];
    
    // Process texts in batches to avoid API limits
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => generateSingleEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
      
      // Add small delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Generated ${embeddings.length} embeddings successfully`);
    return embeddings;
    
  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
    console.log('🔄 Falling back to deterministic embeddings');
    return texts.map(text => hashEmbed(text));
  }
}

/**
 * Generate embedding for a single text using Gemini API
 */
async function generateSingleEmbedding(text: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text: text.substring(0, 30000) }] // Limit text length
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data: EmbeddingResponse = await response.json();
  
  if (!data.embedding?.values) {
    throw new Error('Invalid embedding response format');
  }

  return data.embedding.values;
}

/**
 * Deterministic hash-based embedding for testing/fallback
 * Creates a consistent vector representation based on text content
 */
function hashEmbed(text: string): number[] {
  const normalized = text.toLowerCase().trim();
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  
  // Convert hash to vector of specified dimension
  const vector: number[] = [];
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    const hexPair = hash.substring((i * 2) % hash.length, ((i * 2) % hash.length) + 2);
    const value = parseInt(hexPair, 16) / 255; // Normalize to 0-1
    vector.push((value - 0.5) * 2); // Center around 0 (-1 to 1)
  }
  
  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => magnitude > 0 ? val / magnitude : 0);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

/**
 * Embed a single query text (convenience function)
 */
export async function embedQuery(query: string): Promise<number[]> {
  const embeddings = await embedTexts([query]);
  return embeddings[0];
}