#!/usr/bin/env python3
"""
FAISS Helper Script for VTU EduMate RAG System

This script provides FAISS (Facebook AI Similarity Search) functionality for the RAG pipeline.
It can build and query FAISS indices for efficient similarity search.

Requirements:
    pip install faiss-cpu numpy

Usage:
    python scripts/faiss_helper.py build --input rag_index/embeddings.json --output rag_index/faiss.index
    python scripts/faiss_helper.py query --index rag_index/faiss.index --query-vector query.json --k 5
    python scripts/faiss_helper.py --serve  # Start as HTTP server (optional)

Environment Variables:
    FAISS_INDEX_TYPE: IndexFlatIP (default), IndexHNSWFlat, IndexIVFFlat
    FAISS_DIMENSION: 768 (default, matches Gemini text-embedding-004)
"""

import argparse
import json
import numpy as np
import sys
import os
from pathlib import Path

try:
    import faiss
except ImportError:
    print("ERROR: faiss-cpu not installed. Run: pip install faiss-cpu")
    sys.exit(1)

# Configuration
FAISS_INDEX_TYPE = os.getenv('FAISS_INDEX_TYPE', 'IndexFlatIP')  # Inner Product (cosine for normalized vectors)
FAISS_DIMENSION = int(os.getenv('FAISS_DIMENSION', '768'))

class FAISSHelper:
    def __init__(self, dimension=FAISS_DIMENSION):
        self.dimension = dimension
        self.index = None
        self.metadata = None
    
    def build_index(self, embeddings_path, output_path, index_type=FAISS_INDEX_TYPE):
        """Build FAISS index from embeddings JSON file"""
        print(f"🔨 Building FAISS {index_type} index...")
        
        # Load embeddings and metadata
        with open(embeddings_path, 'r') as f:
            data = json.load(f)
        
        chunks = data['chunks']
        embeddings = np.array([chunk['embedding'] for chunk in chunks], dtype=np.float32)
        
        # Normalize embeddings for cosine similarity (if using IndexFlatIP)
        if index_type == 'IndexFlatIP':
            faiss.normalize_L2(embeddings)
        
        # Create index
        if index_type == 'IndexFlatIP':
            self.index = faiss.IndexFlatIP(self.dimension)
        elif index_type == 'IndexHNSWFlat':
            self.index = faiss.IndexHNSWFlat(self.dimension, 32)  # 32 = M parameter
        elif index_type == 'IndexIVFFlat':
            # IVF requires training
            nlist = min(100, max(1, len(embeddings) // 10))  # Number of clusters
            quantizer = faiss.IndexFlatIP(self.dimension)
            self.index = faiss.IndexIVFFlat(quantizer, self.dimension, nlist)
            self.index.train(embeddings)
        else:
            raise ValueError(f"Unsupported index type: {index_type}")
        
        # Add embeddings to index
        self.index.add(embeddings)
        
        # Save index
        faiss.write_index(self.index, output_path)
        
        # Save metadata separately
        metadata = {
            'chunks': [{'id': chunk['id'], 'metadata': chunk['metadata'], 'text': chunk['text']} 
                      for chunk in chunks],
            'index_type': index_type,
            'dimension': self.dimension,
            'count': len(chunks)
        }
        
        metadata_path = output_path.replace('.index', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✅ FAISS index built: {len(chunks)} vectors")
        print(f"📁 Index saved to: {output_path}")
        print(f"📄 Metadata saved to: {metadata_path}")
    
    def load_index(self, index_path):
        """Load FAISS index and metadata"""
        self.index = faiss.read_index(index_path)
        
        metadata_path = index_path.replace('.index', '_metadata.json')
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
        
        print(f"📖 Loaded FAISS index: {self.metadata['count']} vectors")
    
    def query(self, query_vector, k=5):
        """Query FAISS index with vector"""
        if self.index is None:
            raise ValueError("Index not loaded")
        
        query_array = np.array([query_vector], dtype=np.float32)
        
        # Normalize query vector for cosine similarity
        if self.metadata.get('index_type') == 'IndexFlatIP':
            faiss.normalize_L2(query_array)
        
        # Search
        scores, indices = self.index.search(query_array, k)
        
        # Return results with metadata
        results = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx != -1:  # Valid result
                results.append({
                    'rank': i + 1,
                    'score': float(score),
                    'chunk': self.metadata['chunks'][idx]
                })
        
        return results

def main():
    parser = argparse.ArgumentParser(description='FAISS Helper for VTU EduMate RAG')
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Build command
    build_parser = subparsers.add_parser('build', help='Build FAISS index')
    build_parser.add_argument('--input', required=True, help='Input embeddings JSON file')
    build_parser.add_argument('--output', required=True, help='Output FAISS index file')
    build_parser.add_argument('--type', default=FAISS_INDEX_TYPE, help='Index type')
    
    # Query command
    query_parser = subparsers.add_parser('query', help='Query FAISS index')
    query_parser.add_argument('--index', required=True, help='FAISS index file')
    query_parser.add_argument('--query-vector', required=True, help='Query vector JSON file')
    query_parser.add_argument('--k', type=int, default=5, help='Number of results')
    
    # Serve command
    serve_parser = subparsers.add_parser('serve', help='Start HTTP server')
    serve_parser.add_argument('--port', type=int, default=8001, help='Server port')
    serve_parser.add_argument('--index', help='FAISS index file to serve')
    
    args = parser.parse_args()
    
    if args.command == 'build':
        helper = FAISSHelper()
        helper.build_index(args.input, args.output, args.type)
    
    elif args.command == 'query':
        helper = FAISSHelper()
        helper.load_index(args.index)
        
        with open(args.query_vector, 'r') as f:
            query_data = json.load(f)
        
        query_vector = query_data['vector']
        results = helper.query(query_vector, args.k)
        
        print(json.dumps(results, indent=2))
    
    elif args.command == 'serve':
        print("🚧 HTTP server mode not implemented yet")
        print("📝 TODO: Implement Flask/FastAPI server for HTTP queries")
        print("💡 For now, use CLI mode for testing")
    
    else:
        parser.print_help()

if __name__ == '__main__':
    main()