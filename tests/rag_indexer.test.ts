/**
 * RAG Indexer Tests for VTU EduMate
 * 
 * Tests the indexing functionality including:
 * - Document chunking
 * - Index building and loading
 * - JSON driver functionality
 * - Error handling
 * 
 * These tests use deterministic fallback embeddings when GEMINI_API_KEY is not set,
 * ensuring they pass in CI environments without requiring external API access.
 */

import { buildIndex, loadIndex, DocumentChunk, clearIndex } from '../lib/rag/indexer';
import fs from 'fs/promises';
import path from 'path';

// Test configuration
const TEST_INDEX_DIR = path.join(process.cwd(), 'rag_index');
const ORIGINAL_RAG_INDEX_DRIVER = process.env.RAG_INDEX_DRIVER;

describe('RAG Indexer', () => {
  beforeAll(() => {
    // Force JSON driver for tests
    process.env.RAG_INDEX_DRIVER = 'json';
  });

  afterAll(() => {
    // Restore original driver
    if (ORIGINAL_RAG_INDEX_DRIVER) {
      process.env.RAG_INDEX_DRIVER = ORIGINAL_RAG_INDEX_DRIVER;
    } else {
      delete process.env.RAG_INDEX_DRIVER;
    }
  });

  beforeEach(async () => {
    // Clear any existing test index
    await clearIndex();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearIndex();
  });

  describe('Document Chunking', () => {
    test('should create proper document chunks', () => {
      const sampleChunks: DocumentChunk[] = [
        {
          id: 'test_chunk_0',
          text: 'This is a sample text about data structures. Binary trees are hierarchical data structures.',
          metadata: {
            source: 'DSA_unit3.txt',
            page: 1,
            unit: 'unit3',
            chunk_id: 'DSA_unit3_0',
            created_at: new Date().toISOString()
          }
        },
        {
          id: 'test_chunk_1',
          text: 'Operating systems manage computer resources. Process scheduling is a crucial function.',
          metadata: {
            source: 'OS_unit2.txt',
            page: 1,
            unit: 'unit2',
            chunk_id: 'OS_unit2_0',
            created_at: new Date().toISOString()
          }
        }
      ];

      expect(sampleChunks).toHaveLength(2);
      expect(sampleChunks[0].id).toBe('test_chunk_0');
      expect(sampleChunks[0].metadata.source).toBe('DSA_unit3.txt');
      expect(sampleChunks[0].metadata.unit).toBe('unit3');
      expect(sampleChunks[1].metadata.source).toBe('OS_unit2.txt');
    });

    test('should handle chunks with different metadata', () => {
      const chunk: DocumentChunk = {
        id: 'minimal_chunk',
        text: 'Minimal chunk for testing',
        metadata: {
          source: 'test.txt',
          chunk_id: 'test_0',
          created_at: new Date().toISOString()
        }
      };

      expect(chunk.metadata.page).toBeUndefined();
      expect(chunk.metadata.unit).toBeUndefined();
      expect(chunk.metadata.source).toBe('test.txt');
    });
  });

  describe('Index Building', () => {
    test('should build JSON index successfully', async () => {
      const testChunks: DocumentChunk[] = [
        {
          id: 'dsa_test_0',
          text: 'Binary trees are hierarchical data structures where each node has at most two children.',
          metadata: {
            source: 'DSA_unit3.txt',
            unit: 'unit3',
            chunk_id: 'DSA_unit3_0',
            created_at: new Date().toISOString()
          }
        },
        {
          id: 'os_test_0',
          text: 'Process scheduling algorithms determine which process runs at any given time.',
          metadata: {
            source: 'OS_unit2.txt',
            unit: 'unit2',
            chunk_id: 'OS_unit2_0',
            created_at: new Date().toISOString()
          }
        }
      ];

      // Build index
      await buildIndex(testChunks, 'json');

      // Verify index file was created
      const indexPath = path.join(TEST_INDEX_DIR, 'index.json');
      const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
      expect(indexExists).toBe(true);

      // Verify index content
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const indexData = JSON.parse(indexContent);

      expect(indexData.chunks).toHaveLength(2);
      expect(indexData.metadata.driver).toBe('json');
      expect(indexData.metadata.chunk_count).toBe(2);
      expect(indexData.chunks[0].embedding).toBeDefined();
      expect(Array.isArray(indexData.chunks[0].embedding)).toBe(true);
    }, 30000); // Increase timeout for embedding generation

    test('should handle empty chunk array', async () => {
      const emptyChunks: DocumentChunk[] = [];

      await buildIndex(emptyChunks, 'json');

      const indexData = await loadIndex();
      expect(indexData).not.toBeNull();
      expect(indexData!.chunks).toHaveLength(0);
      expect(indexData!.metadata.chunk_count).toBe(0);
    });

    test('should generate embeddings for chunks', async () => {
      const testChunk: DocumentChunk = {
        id: 'embedding_test',
        text: 'This is a test chunk for embedding generation',
        metadata: {
          source: 'test.txt',
          chunk_id: 'test_embedding',
          created_at: new Date().toISOString()
        }
      };

      await buildIndex([testChunk], 'json');

      const indexData = await loadIndex();
      expect(indexData).not.toBeNull();
      expect(indexData!.chunks[0].embedding).toBeDefined();
      expect(indexData!.chunks[0].embedding).toHaveLength(768); // Gemini embedding dimension
      expect(typeof indexData!.chunks[0].embedding[0]).toBe('number');
    }, 30000);
  });

  describe('Index Loading', () => {
    test('should load existing index', async () => {
      // First create an index
      const testChunks: DocumentChunk[] = [
        {
          id: 'load_test',
          text: 'Test chunk for loading',
          metadata: {
            source: 'load_test.txt',
            chunk_id: 'load_0',
            created_at: new Date().toISOString()
          }
        }
      ];

      await buildIndex(testChunks, 'json');

      // Now load it
      const loadedIndex = await loadIndex();

      expect(loadedIndex).not.toBeNull();
      expect(loadedIndex!.chunks).toHaveLength(1);
      expect(loadedIndex!.chunks[0].id).toBe('load_test');
      expect(loadedIndex!.chunks[0].text).toBe('Test chunk for loading');
      expect(loadedIndex!.metadata.driver).toBe('json');
    });

    test('should return null when no index exists', async () => {
      await clearIndex(); // Ensure no index exists

      const loadedIndex = await loadIndex();
      expect(loadedIndex).toBeNull();
    });

    test('should handle corrupted index file', async () => {
      // Create corrupted index file
      const indexPath = path.join(TEST_INDEX_DIR, 'index.json');
      await fs.mkdir(TEST_INDEX_DIR, { recursive: true });
      await fs.writeFile(indexPath, 'invalid json content');

      const loadedIndex = await loadIndex();
      expect(loadedIndex).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported index driver', async () => {
      const testChunk: DocumentChunk = {
        id: 'error_test',
        text: 'Test chunk',
        metadata: {
          source: 'error_test.txt',
          chunk_id: 'error_0',
          created_at: new Date().toISOString()
        }
      };

      await expect(buildIndex([testChunk], 'unsupported_driver')).rejects.toThrow('Unsupported index driver');
    });

    test('should handle chunks with very long text', async () => {
      const longText = 'A'.repeat(50000); // Very long text
      const longChunk: DocumentChunk = {
        id: 'long_test',
        text: longText,
        metadata: {
          source: 'long_test.txt',
          chunk_id: 'long_0',
          created_at: new Date().toISOString()
        }
      };

      // Should not throw error
      await expect(buildIndex([longChunk], 'json')).resolves.not.toThrow();

      const indexData = await loadIndex();
      expect(indexData).not.toBeNull();
      expect(indexData!.chunks[0].text).toBe(longText);
    }, 30000);
  });

  describe('Index Metadata', () => {
    test('should include proper metadata in index', async () => {
      const testChunk: DocumentChunk = {
        id: 'metadata_test',
        text: 'Test for metadata',
        metadata: {
          source: 'metadata_test.txt',
          chunk_id: 'metadata_0',
          created_at: new Date().toISOString()
        }
      };

      await buildIndex([testChunk], 'json');
      const indexData = await loadIndex();

      expect(indexData).not.toBeNull();
      expect(indexData!.metadata).toBeDefined();
      expect(indexData!.metadata.driver).toBe('json');
      expect(indexData!.metadata.chunk_count).toBe(1);
      expect(indexData!.metadata.embedding_model).toBe('text-embedding-004');
      expect(indexData!.metadata.created_at).toBeDefined();
      expect(indexData!.metadata.updated_at).toBeDefined();
    });

    test('should update metadata on index rebuild', async () => {
      // Build initial index
      const chunk1: DocumentChunk = {
        id: 'update_test_1',
        text: 'First chunk',
        metadata: {
          source: 'update_test.txt',
          chunk_id: 'update_0',
          created_at: new Date().toISOString()
        }
      };

      await buildIndex([chunk1], 'json');
      const firstIndex = await loadIndex();
      const firstTimestamp = firstIndex!.metadata.created_at;

      // Wait a bit and rebuild with more chunks
      await new Promise(resolve => setTimeout(resolve, 100));

      const chunk2: DocumentChunk = {
        id: 'update_test_2',
        text: 'Second chunk',
        metadata: {
          source: 'update_test.txt',
          chunk_id: 'update_1',
          created_at: new Date().toISOString()
        }
      };

      await buildIndex([chunk1, chunk2], 'json');
      const secondIndex = await loadIndex();

      expect(secondIndex!.metadata.chunk_count).toBe(2);
      expect(secondIndex!.metadata.updated_at).not.toBe(firstTimestamp);
    });
  });
});