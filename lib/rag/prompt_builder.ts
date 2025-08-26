/**
 * RAG Prompt Builder for VTU EduMate
 * 
 * Constructs optimized prompts for Gemini using retrieved context chunks.
 * Formats context with proper citations and maintains VTU academic standards.
 * 
 * Design principles:
 * - Strict context adherence (no hallucination)
 * - Proper academic citation format
 * - VTU examination answer standards
 * - Token budget optimization
 * - Clear instruction hierarchy
 */

import { RetrievalResult } from './retriever';

export interface PromptOptions {
  maxContextTokens?: number;
  includeMetadata?: boolean;
  answerFormat?: 'detailed' | 'concise' | 'exam';
  citationStyle?: 'inline' | 'numbered' | 'vtu';
}

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  fullPrompt: string;
  contextSources: string[];
  tokenEstimate: number;
}

/**
 * Build optimized prompt from retrieved chunks and question
 */
export function buildPrompt(
  retrievedChunks: RetrievalResult[],
  question: string,
  options: PromptOptions = {}
): BuiltPrompt {
  const {
    maxContextTokens = 4000,
    includeMetadata = true,
    answerFormat = 'detailed',
    citationStyle = 'vtu'
  } = options;

  console.log(`📝 Building prompt with ${retrievedChunks.length} chunks, format: ${answerFormat}`);

  // Build system prompt with strict instructions
  const systemPrompt = buildSystemPrompt(answerFormat, citationStyle);
  
  // Build context section from retrieved chunks
  const { contextText, sources, estimatedTokens } = buildContextSection(
    retrievedChunks, 
    maxContextTokens, 
    includeMetadata,
    citationStyle
  );
  
  // Build user prompt with question and context
  const userPrompt = buildUserPrompt(question, contextText, answerFormat);
  
  // Combine for full prompt
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  
  console.log(`✅ Prompt built: ~${estimatedTokens} tokens, ${sources.length} sources`);
  
  return {
    systemPrompt,
    userPrompt,
    fullPrompt,
    contextSources: sources,
    tokenEstimate: estimatedTokens
  };
}

/**
 * Build system prompt with VTU-specific instructions
 */
function buildSystemPrompt(answerFormat: string, citationStyle: string): string {
  const baseInstructions = `You are VTU EduMate, an AI assistant for Visvesvaraya Technological University (VTU). You provide accurate, comprehensive answers based on official VTU syllabus and course materials.

CRITICAL RULES:
1. Answer ONLY from the provided context
2. If you cannot find an answer in the context, respond: "Not found in VTU context."
3. Cite facts using the format [source:page] after relevant sentences
4. Follow VTU examination answer standards
5. Return response as JSON object with keys: answer, citations, exam_format`;

  const formatInstructions = {
    detailed: `
ANSWER FORMAT:
- Provide comprehensive explanations with examples
- Include technical details and diagrams when relevant
- Structure answers with clear headings and bullet points
- Aim for university-level depth and clarity`,

    concise: `
ANSWER FORMAT:
- Provide concise, direct answers (150-300 words)
- Focus on key concepts and essential information
- Use bullet points for clarity
- Suitable for quick reference`,

    exam: `
ANSWER FORMAT:
- Follow VTU examination answer patterns
- Include proper technical terminology
- Provide step-by-step explanations where applicable
- Add relevant diagrams/flowchart descriptions
- Structure for maximum marks in VTU exams`
  };

  const citationInstructions = {
    inline: 'Use inline citations: [source:page] immediately after facts.',
    numbered: 'Use numbered citations: [1], [2], etc. with reference list at end.',
    vtu: 'Use VTU academic format: [source p.page] for citations.'
  };

  return `${baseInstructions}

${formatInstructions[answerFormat as keyof typeof formatInstructions] || formatInstructions.detailed}

CITATION RULES:
${citationInstructions[citationStyle as keyof typeof citationInstructions] || citationInstructions.vtu}

EXAM FORMAT CLASSIFICATION:
- two_mark: Brief, definitional answers (2-3 sentences)
- six_mark: Moderate explanations with examples (1-2 paragraphs)
- viva: Comprehensive analysis with applications (multiple sections)`;
}

/**
 * Build context section from retrieved chunks
 */
function buildContextSection(
  chunks: RetrievalResult[],
  maxTokens: number,
  includeMetadata: boolean,
  citationStyle: string
): { contextText: string; sources: string[]; estimatedTokens: number } {
  let contextText = 'CONTEXT INFORMATION:\n\n';
  let estimatedTokens = 50; // Base overhead
  const sources: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Build source header
    const sourceId = `${chunk.metadata.source}${chunk.metadata.page ? `:p${chunk.metadata.page}` : ''}`;
    const sourceHeader = `[${sourceId}]\n`;
    
    // Build metadata line if requested
    const metadataLine = includeMetadata 
      ? `Source: ${chunk.metadata.source}, Page: ${chunk.metadata.page || 'N/A'}, Unit: ${chunk.metadata.unit || 'N/A'}, Score: ${chunk.score.toFixed(3)}\n`
      : '';
    
    // Estimate tokens (rough: 1 token ≈ 4 characters)
    const chunkText = `${sourceHeader}${metadataLine}${chunk.text}\n\n`;
    const chunkTokens = Math.ceil(chunkText.length / 4);
    
    // Check if adding this chunk would exceed token limit
    if (estimatedTokens + chunkTokens > maxTokens && i > 0) {
      console.log(`⚠️ Truncating context at chunk ${i} to stay within ${maxTokens} token limit`);
      break;
    }
    
    contextText += chunkText;
    sources.push(sourceId);
    estimatedTokens += chunkTokens;
  }
  
  return { contextText, sources, estimatedTokens };
}

/**
 * Build user prompt with question and context
 */
function buildUserPrompt(question: string, contextText: string, answerFormat: string): string {
  const formatHints = {
    detailed: 'Provide a comprehensive, detailed answer.',
    concise: 'Provide a concise, focused answer.',
    exam: 'Provide an examination-style answer suitable for VTU standards.'
  };

  return `${contextText}

QUESTION: ${question}

INSTRUCTIONS: ${formatHints[answerFormat as keyof typeof formatHints] || formatHints.detailed} Base your answer strictly on the provided context. Include proper citations and classify the answer format (two_mark, six_mark, or viva) based on the question complexity and required depth.

Respond in JSON format:
{
  "answer": "Your detailed answer here with [source:page] citations",
  "citations": [{"source": "filename", "page": 1, "chunk_id": "id"}],
  "exam_format": "six_mark"
}`;
}

/**
 * Build prompt for follow-up questions
 */
export function buildFollowUpPrompt(
  originalQuestion: string,
  originalAnswer: string,
  followUpQuestion: string,
  newChunks: RetrievalResult[]
): BuiltPrompt {
  const options: PromptOptions = {
    answerFormat: 'detailed',
    maxContextTokens: 3000 // Leave room for conversation history
  };
  
  // Build context from new chunks
  const contextSection = buildContextSection(newChunks, 3000, true, 'vtu');
  
  const systemPrompt = `You are VTU EduMate continuing a conversation. Consider the previous question and answer when responding to the follow-up question. Maintain consistency and build upon previous information.

PREVIOUS CONTEXT:
Question: ${originalQuestion}
Answer: ${originalAnswer.substring(0, 500)}...

${buildSystemPrompt('detailed', 'vtu')}`;

  const userPrompt = `${contextSection.contextText}

FOLLOW-UP QUESTION: ${followUpQuestion}

Provide a comprehensive answer that builds upon the previous discussion while addressing the new question. Use the same JSON format as before.`;

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  return {
    systemPrompt,
    userPrompt,
    fullPrompt,
    contextSources: contextSection.sources,
    tokenEstimate: contextSection.estimatedTokens + 500 // Add overhead for conversation history
  };
}

/**
 * Estimate token count for text (approximate)
 */
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Optimize prompt for token limits
 */
export function optimizePromptForTokens(
  prompt: BuiltPrompt,
  maxTokens: number
): BuiltPrompt {
  if (prompt.tokenEstimate <= maxTokens) {
    return prompt; // Already within limits
  }
  
  console.log(`⚠️ Prompt optimization needed: ${prompt.tokenEstimate} > ${maxTokens} tokens`);
  
  // Calculate how much to reduce context
  const systemTokens = estimateTokens(prompt.systemPrompt);
  const questionTokens = estimateTokens(prompt.userPrompt.split('CONTEXT INFORMATION:')[0]);
  const availableContextTokens = maxTokens - systemTokens - questionTokens - 100; // Safety margin
  
  // Re-extract user prompt to get question
  const questionMatch = prompt.userPrompt.match(/QUESTION: (.+?)(?:\n|$)/);
  const question = questionMatch ? questionMatch[1] : 'Unknown question';
  
  // This would require re-building with smaller context - for now, truncate
  const truncatedUserPrompt = prompt.userPrompt.substring(0, availableContextTokens * 4);
  const truncatedFullPrompt = `${prompt.systemPrompt}\n\n${truncatedUserPrompt}`;
  
  return {
    ...prompt,
    userPrompt: truncatedUserPrompt,
    fullPrompt: truncatedFullPrompt,
    tokenEstimate: maxTokens
  };
}