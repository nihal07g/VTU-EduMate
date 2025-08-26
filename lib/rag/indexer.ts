/**
 * RAG Index Management for VTU EduMate
 * 
 * Supports multiple index drivers: json (default), faiss, chroma
 * Configurable via RAG_INDEX_DRIVER environment variable
 * 
 * Index drivers:
 * - json: Simple JSON file storage (default, no external dependencies)
 * - faiss: Facebook AI Similarity Search (requires Python faiss-cpu package)
 * - chroma: ChromaDB vector database (requires Chroma server)
 * 
 * Production scaling notes:
 * - For large datasets (>100k docs), use faiss or chroma
 * - For cloud deployment, consider Pinecone, Weaviate, or Qdrant
 * - JSON driver suitable for small datasets (<10k docs)
 * - Implement index versioning for production updates
 */

import fs from 'fs/promises';
import path from 'path';
import { embedTexts } from './embeddings';

const RAG_INDEX_DRIVER = process.env.RAG_INDEX_DRIVER || 'json';
const INDEX_DIR = path.join(process.cwd(), 'rag_index');

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    page?: number;
    unit?: string;
    chunk_id: string;
    created_at: string;
  };
}

export interface IndexedChunk extends DocumentChunk {
  embedding: number[];
}

export interface IndexData {
  chunks: IndexedChunk[];
  metadata: {
    driver: string;
    created_at: string;
    updated_at: string;
    chunk_count: number;
    embedding_model: string;
  };
}

/**
 * Build index from document chunks using specified driver
 */
export async function buildIndex(
  chunks: DocumentChunk[], 
  driver: string = RAG_INDEX_DRIVER
): Promise<void> {
  console.log(`🔨 Building RAG index with ${driver} driver for ${chunks.length} chunks`);
  
  // Ensure index directory exists
  await fs.mkdir(INDEX_DIR, { recursive: true });
  
  // Generate embeddings for all chunks
  console.log('📊 Generating embeddings...');
  const texts = chunks.map(chunk => chunk.text);
  const embeddings = await embedTexts(texts);
  
  // Create indexed chunks
  const indexedChunks: IndexedChunk[] = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i]
  }));
  
  // Build index based on driver
  switch (driver) {
    case 'json':
      await buildJsonIndex(indexedChunks);
      break;
    case 'faiss':
      await buildFaissIndex(indexedChunks);
      break;
    case 'chroma':
      await buildChromaIndex(indexedChunks);
      break;
    default:
      throw new Error(`Unsupported index driver: ${driver}`);
  }
  
  console.log(`✅ Index built successfully with ${driver} driver`);
}

/**
 * Load index using current driver
 */
export async function loadIndex(): Promise<IndexData | null> {
  try {
    switch (RAG_INDEX_DRIVER) {
      case 'json':
        return await loadJsonIndex();
      case 'faiss':
        return await loadFaissIndex();
      case 'chroma':
        return await loadChromaIndex();
      default:
        throw new Error(`Unsupported index driver: ${RAG_INDEX_DRIVER}`);
    }
  } catch (error) {
    console.error(`❌ Failed to load index with ${RAG_INDEX_DRIVER} driver:`, error);
    return null;
  }
}

/**
 * JSON Index Implementation (Default)
 */
async function buildJsonIndex(chunks: IndexedChunk[]): Promise<void> {
  const indexData: IndexData = {
    chunks,
    metadata: {
      driver: 'json',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      chunk_count: chunks.length,
      embedding_model: 'text-embedding-004'
    }
  };
  
  const indexPath = path.join(INDEX_DIR, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
  console.log(`💾 JSON index saved to ${indexPath}`);
}

async function loadJsonIndex(): Promise<IndexData | null> {
  const indexPath = path.join(INDEX_DIR, 'index.json');
  
  try {
    const data = await fs.readFile(indexPath, 'utf-8');
    const indexData: IndexData = JSON.parse(data);
    console.log(`📖 Loaded JSON index with ${indexData.chunks.length} chunks`);
    return indexData;
  } catch (error) {
    console.warn('⚠️ No JSON index found or failed to load');
    return null;
  }
}

/**
 * FAISS Index Implementation
 * Requires Python faiss-cpu package and faiss_helper.py script
 */
async function buildFaissIndex(chunks: IndexedChunk[]): Promise<void> {
  // TODO: Implement FAISS index building
  // This would call the Python faiss_helper.py script
  
  console.log('🚧 FAISS index building - TODO: Implement Python bridge');
  console.log('📝 To implement FAISS:');
  console.log('   1. Install: pip install faiss-cpu numpy');
  console.log('   2. Create scripts/faiss_helper.py');
  console.log('   3. Call Python script from Node.js using child_process');
  console.log('   4. Store embeddings and metadata separately');
  
  // For now, fallback to JSON
  await buildJsonIndex(chunks);
}

async function loadFaissIndex(): Promise<IndexData | null> {
  console.log('🚧 FAISS index loading - falling back to JSON');
  return await loadJsonIndex();
}

/**
 * Chroma Index Implementation
 * Requires ChromaDB server running locally or remotely
 */
async function buildChromaIndex(chunks: IndexedChunk[]): Promise<void> {
  // TODO: Implement ChromaDB integration
  
  console.log('🚧 ChromaDB index building - TODO: Implement Chroma client');
  console.log('📝 To implement ChromaDB:');
  console.log('   1. Install: npm install chromadb');
  console.log('   2. Start Chroma server: docker run -p 8000:8000 chromadb/chroma');
  console.log('   3. Create collection and add documents');
  console.log('   4. Configure collection name and connection settings');
  
  // For now, fallback to JSON
  await buildJsonIndex(chunks);
}

async function loadChromaIndex(): Promise<IndexData | null> {
  console.log('🚧 ChromaDB index loading - falling back to JSON');
  return await loadJsonIndex();
}

/**
 * Get index statistics
 */
export async function getIndexStats(): Promise<object> {
  const indexData = await loadIndex();
  
  if (!indexData) {
    return {
      status: 'not_found',
      driver: RAG_INDEX_DRIVER,
      chunk_count: 0
    };
  }
  
  return {
    status: 'ready',
    driver: indexData.metadata.driver,
    chunk_count: indexData.metadata.chunk_count,
    created_at: indexData.metadata.created_at,
    updated_at: indexData.metadata.updated_at,
    embedding_model: indexData.metadata.embedding_model
  };
}

/**
 * Clear/reset index
 */
export async function clearIndex(): Promise<void> {
  console.log(`🗑️ Clearing ${RAG_INDEX_DRIVER} index`);
  
  try {
    const indexPath = path.join(INDEX_DIR, 'index.json');
    await fs.unlink(indexPath);
    console.log('✅ Index cleared successfully');
  } catch (error) {
    console.warn('⚠️ No index to clear or error occurred:', error);
  }
}