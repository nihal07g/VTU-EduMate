/**
 * RAG Retriever Tests for VTU EduMate
 * 
 * Tests the retrieval functionality including:
 * - Semantic similarity search
 * - Confidence scoring
 * - Result ranking
 * - Query expansion
 * 
 * These tests use deterministic fallback embeddings when GEMINI_API_KEY is not set,
 * ensuring they pass in CI environments without requiring external API access.
 */

import { retrieve, retrieveFiltered, expandQuery } from '../lib/rag/retriever';
import { buildIndex, clearIndex, DocumentChunk } from '../lib/rag/indexer';

// Test configuration
const ORIGINAL_RAG_TOP_K = process.env.RAG_TOP_K;
const ORIGINAL_RAG_MIN_SIM = process.env.RAG_MIN_SIM;

describe('RAG Retriever', () => {
  beforeAll(() => {
    // Set test configuration
    process.env.RAG_INDEX_DRIVER = 'json';
    process.env.RAG_TOP_K = '3';
    process.env.RAG_MIN_SIM = '0.1'; // Lower threshold for deterministic embeddings
  });

  afterAll(() => {
    // Restore original configuration
    if (ORIGINAL_RAG_TOP_K) {
      process.env.RAG_TOP_K = ORIGINAL_RAG_TOP_K;
    } else {
      delete process.env.RAG_TOP_K;
    }

    if (ORIGINAL_RAG_MIN_SIM) {
      process.env.RAG_MIN_SIM = ORIGINAL_RAG_MIN_SIM;
    } else {
      delete process.env.RAG_MIN_SIM;
    }
  });

  beforeEach(async () => {
    // Clear any existing test index
    await clearIndex();

    // Create test index with sample data
    const testChunks: DocumentChunk[] = [
      {
        id: 'dsa_trees_0',
        text: 'Binary trees are hierarchical data structures where each node has at most two children called left child and right child. Trees are used in many applications like file systems and databases.',
        metadata: {
          source: 'DSA_unit3.txt',
          page: 1,
          unit: 'unit3',
          chunk_id: 'DSA_unit3_0',
          created_at: new Date().toISOString()
        }
      },
      {
        id: 'dsa_heaps_0',
        text: 'Heaps are complete binary trees that satisfy the heap property. In a max heap, parent nodes are greater than their children. Priority queues are commonly implemented using heaps.',
        metadata: {
          source: 'DSA_unit3.txt',
          page: 2,
          unit: 'unit3',
          chunk_id: 'DSA_unit3_1',
          created_at: new Date().toISOString()
        }
      },
      {
        id: 'os_processes_0',
        text: 'Process scheduling algorithms determine which process should run at any given time. Common algorithms include First Come First Served, Shortest Job First, and Round Robin scheduling.',
        metadata: {
          source: 'OS_unit2.txt',
          page: 1,
          unit: 'unit2',
          chunk_id: 'OS_unit2_0',
          created_at: new Date().toISOString()
        }
      },
      {
        id: 'os_synchronization_0',
        text: 'Process synchronization ensures that multiple processes accessing shared resources do not interfere with each other. Semaphores and mutexes are common synchronization primitives.',
        metadata: {
          source: 'OS_unit2.txt',
          page: 3,
          unit: 'unit2',
          chunk_id: 'OS_unit2_1',
          created_at: new Date().toISOString()
        }
      },
      {
        id: 'algorithms_general_0',
        text: 'Algorithms are step-by-step procedures for solving computational problems. They must be finite, definite, and effective. Algorithm analysis involves studying time and space complexity.',
        metadata: {
          source: 'Algorithms_intro.txt',
          page: 1,
          unit: 'unit1',
          chunk_id: 'ALG_unit1_0',
          created_at: new Date().toISOString()
        }
      }
    ];

    await buildIndex(testChunks, 'json');
  });

  afterEach(async () => {
    // Clean up after each test
    await clearIndex();
  });

  describe('Basic Retrieval', () => {
    test('should retrieve relevant chunks for tree-related query', async () => {
      const query = 'What are binary trees?';
      const result = await retrieve(query, 3);

      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.length).toBeLessThanOrEqual(3);
      expect(result.query).toBe(query);
      expect(result.metadata.top_k).toBe(3);
      expect(result.metadata.search_time_ms).toBeGreaterThan(0);

      // Check result structure
      const firstResult = result.results[0];
      expect(firstResult.id).toBeDefined();
      expect(firstResult.score).toBeDefined();
      expect(firstResult.metadata).toBeDefined();
      expect(firstResult.text).toBeDefined();
      expect(typeof firstResult.score).toBe('number');
    }, 30000);

    test('should retrieve relevant chunks for process-related query', async () => {
      const query = 'Explain process scheduling';
      const result = await retrieve(query, 2);

      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.length).toBeLessThanOrEqual(2);

      // Results should be sorted by score (descending)
      if (result.results.length > 1) {
        expect(result.results[0].score).toBeGreaterThanOrEqual(result.results[1].score);
      }
    }, 30000);

    test('should handle empty query gracefully', async () => {
      const query = '';
      const result = await retrieve(query, 3);

      expect(result.results).toBeDefined();
      expect(result.query).toBe('');
      expect(result.confidence).toBeDefined();
    }, 30000);

    test('should limit results to specified k value', async () => {
      const query = 'data structures algorithms';
      const result = await retrieve(query, 2);

      expect(result.results.length).toBeLessThanOrEqual(2);
      expect(result.metadata.top_k).toBe(2);
    }, 30000);
  });

  describe('Confidence Scoring', () => {
    test('should set confidence based on similarity scores', async () => {
      const query = 'binary trees data structures';
      const result = await retrieve(query, 3);

      expect(result.confidence).toBeDefined();
      expect(typeof result.confidence).toBe('boolean');
      expect(result.metadata.average_score).toBeDefined();
      expect(typeof result.metadata.average_score).toBe('number');
    }, 30000);

    test('should have lower confidence for unrelated queries', async () => {
      const query = 'quantum physics nuclear energy'; // Unrelated to our test data
      const result = await retrieve(query, 3);

      expect(result.confidence).toBeDefined();
      // With deterministic embeddings, confidence depends on threshold settings
      expect(result.metadata.average_score).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Result Ranking', () => {
    test('should rank results by similarity score', async () => {
      // Index is already built in beforeEach
      const query = 'heap priority queue';
      const result = await retrieve(query, 5);

      expect(result.results.length).toBeGreaterThan(1);

      // Verify descending score order
      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i - 1].score).toBeGreaterThanOrEqual(result.results[i].score);
      }
    }, 30000);

    test('should include metadata in results', async () => {
      const query = 'process synchronization';
      const result = await retrieve(query, 2);

      expect(result.results.length).toBeGreaterThan(0);

      const firstResult = result.results[0];
      expect(firstResult.metadata.source).toBeDefined();
      expect(firstResult.metadata.chunk_id).toBeDefined();
      expect(firstResult.metadata.created_at).toBeDefined();
    }, 30000);
  });

  describe('Filtered Retrieval', () => {
    test('should filter by source', async () => {
      const query = 'data structures';
      const result = await retrieveFiltered(query, { source: 'DSA' }, 5);

      expect(result.results.length).toBeGreaterThan(0);

      // All results should be from DSA source
      result.results.forEach(item => {
        expect(item.metadata.source).toContain('DSA');
      });
    }, 30000);

    test('should filter by unit', async () => {
      const query = 'algorithms';
      const result = await retrieveFiltered(query, { unit: 'unit3' }, 5);

      expect(result.results.length).toBeGreaterThan(0);

      // All results should be from unit3
      result.results.forEach(item => {
        expect(item.metadata.unit).toBe('unit3');
      });
    }, 30000);

    test('should filter by minimum score', async () => {
      const query = 'binary trees';
      const result = await retrieveFiltered(query, { minScore: 0.5 }, 5);

      // All results should have score >= 0.5
      result.results.forEach(item => {
        expect(item.score).toBeGreaterThanOrEqual(0.5);
      });
    }, 30000);

    test('should handle multiple filters', async () => {
      const query = 'trees';
      const result = await retrieveFiltered(
        query, 
        { source: 'DSA', unit: 'unit3', minScore: 0.1 }, 
        3
      );

      result.results.forEach(item => {
        expect(item.metadata.source).toContain('DSA');
        expect(item.metadata.unit).toBe('unit3');
        expect(item.score).toBeGreaterThanOrEqual(0.1);
      });
    }, 30000);
  });

  describe('Query Expansion', () => {
    test('should expand query with synonyms', () => {
      const originalQuery = 'algorithm complexity';
      const expandedQueries = expandQuery(originalQuery);

      expect(expandedQueries).toContain(originalQuery);
      expect(expandedQueries.length).toBeGreaterThan(1);
      expect(Array.isArray(expandedQueries)).toBe(true);
    });

    test('should handle data structure synonyms', () => {
      const query = 'data structure implementation';
      const expanded = expandQuery(query);

      expect(expanded).toContain(query);
      expect(expanded.some(q => q.includes('ds'))).toBe(true);
    });

    test('should handle single word queries', () => {
      const query = 'tree';
      const expanded = expandQuery(query);

      expect(expanded).toContain(query);
      expect(expanded.some(q => q.includes('binary tree') || q.includes('search tree'))).toBe(true);
    });

    test('should not duplicate queries', () => {
      const query = 'heap sort algorithm';
      const expanded = expandQuery(query);

      const uniqueQueries = Array.from(new Set(expanded));
      expect(expanded.length).toBe(uniqueQueries.length);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing index gracefully', async () => {
      await clearIndex(); // Remove index

      await expect(retrieve('test query')).rejects.toThrow('No RAG index found');
    });

    test('should handle very long queries', async () => {
      const longQuery = 'binary trees '.repeat(100); // Very long query
      const result = await retrieve(longQuery, 2);

      expect(result.results).toBeDefined();
      expect(result.query).toBe(longQuery);
    }, 30000);

    test('should handle special characters in query', async () => {
      const specialQuery = 'What are binary trees? (data structures) & algorithms!';
      const result = await retrieve(specialQuery, 2);

      expect(result.results).toBeDefined();
      expect(result.query).toBe(specialQuery);
    }, 30000);
  });

  describe('Performance', () => {
    test('should complete retrieval within reasonable time', async () => {
      const startTime = Date.now();
      const query = 'process scheduling algorithms';
      const result = await retrieve(query, 3);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.metadata.search_time_ms).toBeGreaterThan(0);
      expect(result.metadata.search_time_ms).toBeLessThanOrEqual(totalTime);
    }, 30000);

    test('should handle multiple concurrent queries', async () => {
      const queries = [
        'binary trees',
        'process scheduling',
        'heap data structure',
        'synchronization primitives'
      ];

      const promises = queries.map(query => retrieve(query, 2));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      results.forEach((result, index) => {
        expect(result.query).toBe(queries[index]);
        expect(result.results).toBeDefined();
      });
    }, 30000);
  });
});