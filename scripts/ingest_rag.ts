#!/usr/bin/env ts-node
/**
 * RAG Ingestion Script for VTU EduMate
 * 
 * REQUIRES: 
 * - GEMINI_API_KEY (server-side, for embeddings)
 * - RAG_INDEX_DRIVER (optional, defaults to 'json')
 * 
 * This script:
 * 1. Reads PDFs and text files from data/sample_pdfs/
 * 2. Extracts and chunks text content
 * 3. Generates embeddings using Gemini text-embedding-004
 * 4. Stores embeddings in configurable index (JSON/FAISS/Chroma)
 * 
 * Usage:
 *   npm run ingest:rag
 *   npx ts-node scripts/ingest_rag.ts
 *   npx ts-node scripts/ingest_rag.ts --source data/custom_pdfs --chunk-size 500
 * 
 * Chunking strategy:
 * - Default chunk size: 700 words
 * - Overlap: 120 words
 * - Preserves sentence boundaries
 * - Maintains paragraph structure where possible
 * 
 * Production scaling notes:
 * - For large document sets, implement parallel processing
 * - Add document deduplication logic
 * - Implement incremental updates (only new/changed files)
 * - Add content quality validation
 * - Support multiple file formats (DOCX, HTML, etc.)
 * - Consider using dedicated PDF parsing services for complex layouts
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { buildIndex, DocumentChunk } from '../lib/rag/indexer';

// Configuration
const DEFAULT_SOURCE_DIR = path.join(process.cwd(), 'data', 'sample_pdfs');
const SYLLABUS_RESOURCES_DIR = path.join(process.cwd(), 'data', 'syllabus_resources');
const DEFAULT_CHUNK_SIZE = 700; // words
const DEFAULT_OVERLAP = 120; // words
const SUPPORTED_EXTENSIONS = ['.txt', '.pdf'];

interface IngestionOptions {
  sourceDir: string;
  chunkSize: number;
  overlap: number;
  verbose: boolean;
}

interface FileMetadata {
  filename: string;
  filepath: string;
  extension: string;
  size: number;
  lastModified: Date;
}

/**
 * Main ingestion function
 */
async function ingestDocuments(options: IngestionOptions): Promise<void> {
  console.log('🚀 Starting VTU EduMate RAG ingestion...');
  console.log(`📁 Source directory: ${options.sourceDir}`);
  console.log(`📊 Chunk size: ${options.chunkSize} words, overlap: ${options.overlap} words`);
  
  try {
    // Discover files from multiple directories
    let files: FileMetadata[] = [];
    
    // Scan default sample_pdfs directory
    if (existsSync(options.sourceDir)) {
      const sampleFiles = await discoverFiles(options.sourceDir);
      files = files.concat(sampleFiles);
      console.log(`📄 Found ${sampleFiles.length} files in sample_pdfs`);
    }
    
    // Scan syllabus_resources directory
    if (existsSync(SYLLABUS_RESOURCES_DIR)) {
      const syllabusFiles = await discoverFiles(SYLLABUS_RESOURCES_DIR);
      files = files.concat(syllabusFiles);
      console.log(`📚 Found ${syllabusFiles.length} files in syllabus_resources`);
    }
    
    console.log(`📄 Total files found: ${files.length}`);
    
    if (files.length === 0) {
      console.warn('⚠️ No supported files found. Please add .txt or .pdf files to data/sample_pdfs/ or data/syllabus_resources/');
      return;
    }
    
    // Process files and extract text
    const allChunks: DocumentChunk[] = [];
    
    for (const file of files) {
      console.log(`\n📖 Processing: ${file.filename}`);
      
      try {
        const text = await extractText(file);
        const chunks = chunkText(text, file, options.chunkSize, options.overlap);
        
        console.log(`   ✅ Extracted ${chunks.length} chunks`);
        allChunks.push(...chunks);
        
      } catch (error) {
        console.error(`   ❌ Failed to process ${file.filename}:`, error);
        // Continue with other files
      }
    }
    
    console.log(`\n📦 Total chunks created: ${allChunks.length}`);
    
    if (allChunks.length === 0) {
      console.warn('⚠️ No chunks created. Check file contents and formats.');
      return;
    }
    
    // Build index
    console.log('\n🔨 Building RAG index...');
    await buildIndex(allChunks);
    
    console.log('\n✅ RAG ingestion completed successfully!');
    console.log(`📊 Indexed ${allChunks.length} chunks from ${files.length} files`);
    
    // Print summary
    printIngestionSummary(files, allChunks);
    
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  }
}

/**
 * Discover supported files in directory
 */
async function discoverFiles(sourceDir: string): Promise<FileMetadata[]> {
  const files: FileMetadata[] = [];
  
  try {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const filepath = path.join(sourceDir, entry.name);
        const extension = path.extname(entry.name).toLowerCase();
        
        if (SUPPORTED_EXTENSIONS.includes(extension)) {
          const stats = await fs.stat(filepath);
          
          files.push({
            filename: entry.name,
            filepath,
            extension,
            size: stats.size,
            lastModified: stats.mtime
          });
        }
      }
    }
    
  } catch (error) {
    throw new Error(`Failed to read source directory: ${error}`);
  }
  
  return files;
}

/**
 * Extract text from file based on extension
 */
async function extractText(file: FileMetadata): Promise<string> {
  switch (file.extension) {
    case '.txt':
      return await extractTextFromTxt(file.filepath);
    case '.pdf':
      return await extractTextFromPdf(file.filepath);
    default:
      throw new Error(`Unsupported file type: ${file.extension}`);
  }
}

/**
 * Extract text from .txt file
 */
async function extractTextFromTxt(filepath: string): Promise<string> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return content.trim();
  } catch (error) {
    throw new Error(`Failed to read text file: ${error}`);
  }
}

/**
 * Extract text from .pdf file
 * For now, falls back to .txt with same name, or shows instruction to install pdf-parse
 */
async function extractTextFromPdf(filepath: string): Promise<string> {
  // Try to find corresponding .txt file first
  const txtPath = filepath.replace('.pdf', '.txt');
  
  try {
    await fs.access(txtPath);
    console.log(`   📝 Using corresponding .txt file: ${path.basename(txtPath)}`);
    return await extractTextFromTxt(txtPath);
  } catch {
    // No corresponding .txt file found
  }
  
  // TODO: Implement actual PDF parsing
  console.log('   📋 PDF parsing not yet implemented. To add PDF support:');
  console.log('      1. npm install pdf-parse');
  console.log('      2. Update extractTextFromPdf() function');
  console.log('      3. Or provide corresponding .txt file');
  
  throw new Error('PDF parsing not implemented. Please provide corresponding .txt file or implement pdf-parse integration.');
}

/**
 * Chunk text into overlapping segments
 */
function chunkText(
  text: string, 
  file: FileMetadata, 
  chunkSizeWords: number, 
  overlapWords: number
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  
  // Split into sentences for better boundary preservation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let currentWordCount = 0;
  let chunkIndex = 0;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim() + '.';
    const sentenceWords = sentence.split(/\s+/).length;
    
    // Check if adding this sentence would exceed chunk size
    if (currentWordCount + sentenceWords > chunkSizeWords && currentChunk.length > 0) {
      // Create chunk
      chunks.push(createChunk(currentChunk.trim(), file, chunkIndex));
      
      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, overlapWords);
      currentChunk = overlapText + (overlapText ? ' ' : '') + sentence;
      currentWordCount = countWords(currentChunk);
      chunkIndex++;
    } else {
      // Add sentence to current chunk
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentWordCount += sentenceWords;
    }
  }
  
  // Add final chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push(createChunk(currentChunk.trim(), file, chunkIndex));
  }
  
  return chunks;
}

/**
 * Create document chunk with metadata
 */
function createChunk(text: string, file: FileMetadata, index: number): DocumentChunk {
  // Extract subject and unit from filename if possible
  const { subject, unit } = parseFilename(file.filename);
  
  return {
    id: `${file.filename}_chunk_${index}`,
    text,
    metadata: {
      source: file.filename,
      page: undefined, // Would be set for PDF pages
      unit,
      chunk_id: `${file.filename}_${index}`,
      created_at: new Date().toISOString()
    }
  };
}

/**
 * Parse subject and unit from filename
 */
function parseFilename(filename: string): { subject?: string; unit?: string } {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  
  // Try to extract subject and unit (e.g., "DSA_unit3.txt" -> subject: "DSA", unit: "unit3")
  const match = nameWithoutExt.match(/^([A-Za-z]+)_?(unit\d+)?/i);
  
  if (match) {
    return {
      subject: match[1]?.toUpperCase(),
      unit: match[2]?.toLowerCase()
    };
  }
  
  return {};
}

/**
 * Get overlap text from end of chunk
 */
function getOverlapText(text: string, overlapWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= overlapWords) {
    return text;
  }
  
  return words.slice(-overlapWords).join(' ');
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Print ingestion summary
 */
function printIngestionSummary(files: FileMetadata[], chunks: DocumentChunk[]): void {
  console.log('\n📊 INGESTION SUMMARY');
  console.log('═'.repeat(50));
  
  // File breakdown
  console.log('\n📄 Files processed:');
  for (const file of files) {
    const fileChunks = chunks.filter(c => c.metadata.source === file.filename);
    console.log(`   ${file.filename}: ${fileChunks.length} chunks (${file.size} bytes)`);
  }
  
  // Chunk statistics
  const wordCounts = chunks.map(c => countWords(c.text));
  const avgWords = wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length;
  const minWords = Math.min(...wordCounts);
  const maxWords = Math.max(...wordCounts);
  
  console.log('\n📊 Chunk statistics:');
  console.log(`   Total chunks: ${chunks.length}`);
  console.log(`   Average words per chunk: ${avgWords.toFixed(1)}`);
  console.log(`   Word count range: ${minWords} - ${maxWords}`);
  
  // Subject breakdown
  const subjectMap = new Map<string, number>();
  chunks.forEach(chunk => {
    const subject = chunk.metadata.source.split('_')[0] || 'Unknown';
    subjectMap.set(subject, (subjectMap.get(subject) || 0) + 1);
  });
  
  console.log('\n📚 Subject breakdown:');
  subjectMap.forEach((count, subject) => {
    console.log(`   ${subject}: ${count} chunks`);
  });
  
  console.log('\n🎯 Next steps:');
  console.log('   1. Test retrieval: npm run dev');
  console.log('   2. Query RAG API: POST /api/rag/ask');
  console.log('   3. Add more content to data/sample_pdfs/');
}

/**
 * Parse command line arguments
 */
function parseArguments(): IngestionOptions {
  const args = process.argv.slice(2);
  const options: IngestionOptions = {
    sourceDir: DEFAULT_SOURCE_DIR,
    chunkSize: DEFAULT_CHUNK_SIZE,
    overlap: DEFAULT_OVERLAP,
    verbose: false
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--source':
        options.sourceDir = args[++i];
        break;
      case '--chunk-size':
        options.chunkSize = parseInt(args[++i]);
        break;
      case '--overlap':
        options.overlap = parseInt(args[++i]);
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }
  
  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
VTU EduMate RAG Ingestion Script

Usage: npx ts-node scripts/ingest_rag.ts [options]

Options:
  --source <dir>      Source directory for documents (default: data/sample_pdfs)
  --chunk-size <num>  Chunk size in words (default: ${DEFAULT_CHUNK_SIZE})
  --overlap <num>     Overlap size in words (default: ${DEFAULT_OVERLAP})
  --verbose           Enable verbose logging
  --help              Show this help message

Environment Variables:
  GEMINI_API_KEY      Google AI Studio API key (required for embeddings)
  RAG_INDEX_DRIVER    Index driver: json|faiss|chroma (default: json)

Examples:
  npm run ingest:rag
  npx ts-node scripts/ingest_rag.ts --source data/custom_pdfs --chunk-size 500
  npx ts-node scripts/ingest_rag.ts --verbose
`);
}

// Run script if called directly
if (require.main === module) {
  const options = parseArguments();
  ingestDocuments(options).catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}