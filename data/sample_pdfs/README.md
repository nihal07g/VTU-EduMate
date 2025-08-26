# VTU EduMate - Sample PDFs for RAG Testing

This directory contains sample educational content used for RAG (Retrieval-Augmented Generation) testing and development.

## Sample Files

### DSA_unit3.txt
- **Subject**: Data Structures and Algorithms (DSA)
- **Unit**: Unit 3 - Trees and Heaps
- **Content**: Covers basic tree structures, binary trees, heap operations, and priority queues
- **Format**: Plain text for development testing

### OS_unit2.txt
- **Subject**: Operating Systems (OS)
- **Unit**: Unit 2 - Process Management
- **Content**: Process scheduling, synchronization, and deadlock concepts
- **Format**: Plain text for development testing

## Usage

These files are used by the RAG ingestion script (`scripts/ingest_rag.ts`) to:
1. Test the document chunking algorithm
2. Validate embeddings generation
3. Test retrieval accuracy
4. Develop citation mapping

## Production Notes

In production environments:
- Replace with actual VTU syllabus PDFs
- Add proper metadata (scheme, semester, branch, unit)
- Use PDF parsing for real documents
- Implement proper content validation

## File Structure

```
data/sample_pdfs/
├── README.md          # This file
├── DSA_unit3.txt      # Sample DSA content
└── OS_unit2.txt       # Sample OS content
```