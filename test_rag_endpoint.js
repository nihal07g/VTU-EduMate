/**
 * Quick test script for RAG endpoint without external dependencies
 * Run with: node test_rag_endpoint.js
 */

async function testRagEndpoint() {
  try {
    console.log('🧪 Testing RAG endpoint...');
    
    const response = await fetch('http://localhost:3000/api/rag/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'What are binary trees?',
        useRag: true
      })
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Response not OK:', response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ RAG endpoint response:', JSON.stringify(data, null, 2));
    
    // Check if it used RAG
    if (data.metadata && data.metadata.rag_used) {
      console.log('🔍 RAG was successfully used!');
      console.log('📚 Sources found:', data.metadata.sources_count);
      console.log('⚡ Search time:', data.metadata.search_time_ms + 'ms');
    } else {
      console.log('⚠️  RAG fallback to heuristic system');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test also without RAG
async function testHeuristicEndpoint() {
  try {
    console.log('\n🧪 Testing heuristic endpoint (useRag=false)...');
    
    const response = await fetch('http://localhost:3000/api/rag/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'What are binary trees?',
        useRag: false
      })
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Response not OK:', response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ Heuristic response received');
    
    if (data.metadata && !data.metadata.rag_used) {
      console.log('🎯 Correctly used heuristic system');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
console.log('🚀 Starting RAG endpoint tests...\n');
testRagEndpoint().then(() => testHeuristicEndpoint());