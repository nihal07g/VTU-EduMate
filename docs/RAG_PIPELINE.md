# RAG Pipeline for VTU EduMate

## Overview

The Retrieval-Augmented Generation (RAG) pipeline provides intelligent, contextual answers by combining semantic search with AI generation. This system retrieves relevant content from VTU educational materials and uses it to generate accurate, cited responses.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Document      │    │   Embedding     │    │   Vector        │
│   Ingestion     │───▶│   Generation    │───▶│   Index         │
│                 │    │   (Gemini)      │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Response      │    │   Answer        │    │   Semantic      │
│   Formatting    │◀───│   Generation    │◀───│   Retrieval     │
│   & Citations   │    │   (Gemini)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        ▲
                                               ┌─────────────────┐
                                               │   User Query    │
                                               │   Processing    │
                                               └─────────────────┘
```

## Components

### 1. Document Ingestion (`scripts/ingest_rag.ts`)

**Purpose**: Converts PDF/text documents into searchable chunks with embeddings.

**Process**:
1. **Document Discovery**: Scans `data/sample_pdfs/` for `.pdf` and `.txt` files
2. **Text Extraction**: 
   - `.txt`: Direct file reading
   - `.pdf`: Uses `pdf-parse` library (TODO: implement)
3. **Chunking**: Splits content into overlapping segments (700 words, 120 overlap)
4. **Metadata Extraction**: Extracts subject, unit, and source information
5. **Embedding Generation**: Creates vector representations using Gemini
6. **Index Storage**: Saves to configurable backend (JSON/FAISS/Chroma)

**Configuration**:
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
RAG_INDEX_DRIVER=json  # json|faiss|chroma
RAG_CHUNK_SIZE=700     # words per chunk
RAG_OVERLAP=120        # word overlap between chunks
```

**Usage**:
```bash
npm run ingest:rag
npx ts-node scripts/ingest_rag.ts --source data/custom_pdfs --chunk-size 500
```

### 2. Embeddings Service (`lib/rag/embeddings.ts`)

**Purpose**: Generates semantic vector representations of text using Gemini API.

**Features**:
- **Production**: Uses Gemini `text-embedding-004` model (768 dimensions)
- **Fallback**: Deterministic hash-based embeddings for testing/CI
- **Batch Processing**: Handles multiple texts efficiently
- **Rate Limiting**: Respects API limits with delays

**Security**: All API calls are server-side only. Never exposes `GEMINI_API_KEY` to client.

### 3. Index Management (`lib/rag/indexer.ts`)

**Purpose**: Manages vector storage and retrieval across different backends.

**Drivers**:

#### JSON Driver (Default)
- **Pros**: No external dependencies, simple setup
- **Cons**: Limited to ~10k documents, slower for large datasets
- **Storage**: `rag_index/index.json`
- **Best For**: Development, small deployments

#### FAISS Driver
- **Pros**: High performance, scales to millions of vectors
- **Cons**: Requires Python dependencies
- **Setup**: 
  ```bash
  pip install faiss-cpu numpy
  python scripts/faiss_helper.py build --input embeddings.json --output index.faiss
  ```
- **Best For**: Large-scale production

#### ChromaDB Driver (Planned)
- **Pros**: Cloud-native, built for AI applications
- **Cons**: Requires external service
- **Setup**:
  ```bash
  docker run -p 8000:8000 chromadb/chroma
  ```
- **Best For**: Distributed deployments

### 4. Semantic Retrieval (`lib/rag/retriever.ts`)

**Purpose**: Finds most relevant content chunks for user queries.

**Process**:
1. **Query Embedding**: Converts question to vector representation
2. **Similarity Search**: Computes cosine similarity with all indexed chunks
3. **Ranking**: Sorts results by relevance score
4. **Confidence Assessment**: Determines if results meet quality threshold
5. **Filtering**: Applies metadata filters (source, unit, score)

**Configuration**:
```bash
RAG_TOP_K=5        # Number of results to return
RAG_MIN_SIM=0.25   # Minimum similarity for confidence
```

**Advanced Features**:
- **Query Expansion**: Adds synonyms and related terms
- **Metadata Filtering**: Filter by source, unit, minimum score
- **Result Re-ranking**: Consider freshness and source quality

### 5. Prompt Engineering (`lib/rag/prompt_builder.ts`)

**Purpose**: Constructs optimized prompts for accurate AI generation.

**Features**:
- **Context Integration**: Embeds retrieved chunks with proper formatting
- **Citation Instructions**: Ensures proper source attribution
- **Answer Format Control**: Supports different response styles
- **Token Management**: Optimizes context within model limits

**Prompt Structure**:
```
SYSTEM: You are VTU EduMate. Answer ONLY from provided context...

CONTEXT:
[DSA_unit3.txt:p1]
Binary trees are hierarchical data structures...

[OS_unit2.txt:p2]
Process scheduling algorithms determine...

QUESTION: Explain binary tree traversal methods

RESPONSE FORMAT: JSON with answer, citations, exam_format
```

### 6. AI Generation (`lib/rag/gemini_client.ts`)

**Purpose**: Server-side wrapper for Gemini API with robust error handling.

**Features**:
- **Model Fallback**: Primary + fallback model configuration
- **Retry Logic**: Exponential backoff for transient failures
- **Structured Output**: JSON response parsing and validation
- **Security**: API keys never exposed to client-side

**Configuration**:
```bash
GEMINI_API_KEY=your_key_here
GEN_MODEL=gemini-2.0-flash-exp          # Primary model
GEN_MODEL_FALLBACK=gemini-1.5-flash     # Fallback model
```

### 7. API Integration (`app/api/rag/ask/route.ts`)

**Purpose**: Next.js API route exposing RAG functionality.

**Endpoint**: `POST /api/rag/ask`

**Request**:
```json
{
  "question": "Explain heap data structure",
  "scheme": "2022",
  "subject": "DSA",
  "useRag": true
}
```

**Response**:
```json
{
  "answer": "A heap is a complete binary tree that satisfies the heap property...",
  "citations": [
    {"source": "DSA_unit3.txt", "page": 2, "chunk_id": "DSA_unit3_1"}
  ],
  "sources": [
    {"source": "DSA_unit3.txt", "unit": "unit3", "score": 0.87}
  ],
  "debug": {
    "retrieval_confidence": true,
    "search_time_ms": 45,
    "method": "rag"
  }
}
```

## Chunking Strategy

### Default Configuration
- **Chunk Size**: 700 words
- **Overlap**: 120 words (17% overlap)
- **Boundary Preservation**: Respects sentence boundaries
- **Metadata Preservation**: Maintains source, page, unit information

### Chunking Algorithm
```typescript
1. Split document into sentences
2. Group sentences until word limit reached
3. Create chunk with overlap from previous chunk
4. Attach metadata (source, page, unit, timestamp)
5. Generate unique chunk ID
```

### Optimization Guidelines
- **Small Documents** (<1000 words): Use smaller chunks (300-400 words)
- **Technical Content**: Preserve code blocks and equations
- **Structured Content**: Maintain heading hierarchy
- **Multi-language**: Adjust for language-specific tokenization

## Index Drivers

### Choosing the Right Driver

| Driver | Max Documents | Search Speed | Setup Complexity | Best For |
|--------|---------------|--------------|------------------|----------|
| JSON | 10K | Slow | Simple | Development, prototypes |
| FAISS | 10M+ | Very Fast | Medium | Production, large datasets |
| ChromaDB | 100M+ | Fast | Medium | Cloud deployments |
| Pinecone | Unlimited | Fast | Simple | Managed cloud service |

### Migration Between Drivers

```bash
# Export from JSON
npm run export:index --format=json --output=backup.json

# Import to FAISS
npm run import:index --format=faiss --input=backup.json

# Rebuild index
npm run ingest:rag --driver=faiss
```

## Environment Variables

### Required
```bash
# Google AI Studio API key for embeddings and generation
GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional Configuration
```bash
# Generation models
GEN_MODEL=gemini-2.0-flash-exp
GEN_MODEL_FALLBACK=gemini-1.5-flash-latest

# Index configuration
RAG_INDEX_DRIVER=json        # json|faiss|chroma
ENABLE_RAG=false            # Global RAG enable/disable
RAG_TOP_K=5                 # Results per query
RAG_MIN_SIM=0.25           # Confidence threshold

# Performance tuning
RAG_CHUNK_SIZE=700         # Words per chunk
RAG_OVERLAP=120            # Overlap between chunks
RAG_MAX_CONTEXT_TOKENS=4000 # Context window size
```

### Security Environment Variables
```bash
# Production secrets (never commit these)
GEMINI_API_KEY=your_production_key
PINECONE_API_KEY=your_pinecone_key
WEAVIATE_URL=your_weaviate_cluster_url
```

## API Usage

### Basic Query
```bash
curl -X POST http://localhost:3000/api/rag/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is a binary search tree?",
    "useRag": true
  }'
```

### Filtered Query
```bash
curl -X POST http://localhost:3000/api/rag/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain process scheduling",
    "useRag": true,
    "filters": {
      "source": "OS",
      "unit": "unit2",
      "minScore": 0.3
    }
  }'
```

### Integration with Existing System
```javascript
// Client-side usage
const response = await fetch('/api/rag/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: userQuestion,
    scheme: selectedScheme,
    subject: selectedSubject,
    useRag: enableRag
  })
});

const { answer, citations, sources } = await response.json();
```

## Performance Optimization

### Index Performance
- **FAISS**: Use IVF (Inverted File) for >100K documents
- **ChromaDB**: Enable compression for storage efficiency
- **JSON**: Implement index sharding for >5K documents

### Query Performance
- **Caching**: Cache embeddings for common queries
- **Precomputation**: Pre-generate embeddings for FAQ
- **Batch Processing**: Group similar queries together

### Memory Management
- **Streaming**: Process large documents in chunks
- **Cleanup**: Clear temporary embeddings after indexing
- **Monitoring**: Track memory usage during ingestion

## Production Scaling

### Cloud Deployment Options

#### Option 1: Managed Vector Database
```bash
# Pinecone (recommended for quick setup)
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=vtu-edumate
PINECONE_ENVIRONMENT=us-east1-gcp

# Weaviate Cloud Services
WEAVIATE_URL=https://your-cluster.weaviate.network
WEAVIATE_API_KEY=your_key
```

#### Option 2: Self-hosted Vector Database
```bash
# Deploy Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Deploy ChromaDB
docker run -p 8000:8000 chromadb/chroma

# Configure connection
VECTOR_DB_URL=http://your-vector-db:6333
```

#### Option 3: FAISS with Object Storage
```bash
# Store index in S3/GCS
AWS_S3_BUCKET=vtu-edumate-index
GOOGLE_CLOUD_BUCKET=vtu-edumate-index

# Sync index periodically
npm run sync:index --storage=s3
```

### Horizontal Scaling
```bash
# Multiple index replicas
RAG_INDEX_REPLICAS=3
RAG_LOAD_BALANCER=round_robin

# Distributed search
RAG_SEARCH_NODES=node1,node2,node3
RAG_REPLICATION_FACTOR=2
```

### Monitoring and Observability
```bash
# Enable detailed logging
RAG_LOG_LEVEL=debug
RAG_METRICS_ENABLED=true

# Performance tracking
RAG_TRACK_QUERY_TIME=true
RAG_TRACK_EMBEDDING_TIME=true
RAG_TRACK_GENERATION_TIME=true
```

## Testing

### Running Tests
```bash
# Run all RAG tests
npm test

# Run specific test files
npm test -- rag_indexer.test.ts
npm test -- rag_retriever.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Configuration
Tests use deterministic fallback embeddings when `GEMINI_API_KEY` is not available, ensuring CI compatibility.

### Test Data
- Sample documents in `data/sample_pdfs/`
- Synthetic test cases for edge conditions
- Performance benchmarks for large datasets

## Troubleshooting

### Common Issues

#### 1. "No RAG index found"
```bash
# Solution: Run ingestion script
npm run ingest:rag

# Check if index exists
ls -la rag_index/
```

#### 2. "GEMINI_API_KEY not configured"
```bash
# Solution: Set environment variable
export GEMINI_API_KEY=your_key_here

# Or add to .env.local
echo "GEMINI_API_KEY=your_key" >> .env.local
```

#### 3. Low retrieval confidence
```bash
# Check similarity threshold
export RAG_MIN_SIM=0.1

# Verify chunk quality
npm run analyze:chunks

# Increase chunk overlap
npm run ingest:rag --overlap=200
```

#### 4. Slow query performance
```bash
# Switch to FAISS driver
export RAG_INDEX_DRIVER=faiss
npm run rebuild:index

# Reduce result count
export RAG_TOP_K=3
```

### Debug Mode
```bash
# Enable verbose logging
export RAG_DEBUG=true
export RAG_LOG_LEVEL=debug

# Test specific components
npm run test:embeddings
npm run test:retrieval
npm run test:generation
```

## Future Enhancements

### Planned Features
- **Multi-modal Support**: Images, diagrams, equations
- **Real-time Updates**: Incremental index updates
- **Advanced Filtering**: Semantic filters, temporal queries
- **Query Analytics**: Usage patterns, popular topics
- **A/B Testing**: Compare retrieval strategies

### Integration Opportunities
- **Learning Management System**: Canvas, Moodle integration
- **Mobile Apps**: React Native, Flutter clients
- **Voice Interface**: Speech-to-text query support
- **Collaborative Features**: Shared annotations, discussions

### Research Directions
- **Hybrid Search**: Combine semantic + keyword search
- **Fine-tuning**: Domain-specific embedding models
- **Query Understanding**: Intent detection, entity extraction
- **Result Explanation**: Why specific chunks were retrieved

## Security Considerations

### API Security
- **Rate Limiting**: Prevent abuse and control costs
- **Authentication**: Secure access to RAG endpoints
- **Input Validation**: Sanitize queries and parameters
- **Output Filtering**: Remove sensitive information

### Data Privacy
- **Anonymization**: Remove personal information from documents
- **Access Control**: Role-based document access
- **Audit Logging**: Track document access and queries
- **Data Retention**: Automatic cleanup of old indexes

### Production Secrets Management
```bash
# Use environment-specific configs
# Development
cp .env.example .env.local

# Production
kubectl create secret generic rag-secrets \
  --from-literal=GEMINI_API_KEY=prod_key \
  --from-literal=VECTOR_DB_URL=prod_url
```

---

For more information, see:
- [API Documentation](../README.md#rag-api)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)