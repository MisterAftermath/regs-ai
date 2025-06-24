import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { databaseAdapter } from '@/app/(admin)/admin/ingestion/_lib/adapters';
import type { ProcessRequest } from '@/app/(admin)/admin/ingestion/_lib/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: ProcessRequest = await request.json();
    const { documentId, config } = body;

    if (!documentId || !config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Verify document exists
    const document = await databaseAdapter.getDocument(documentId);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    // Check if document is already being processed
    if (document.status === 'processing') {
      return NextResponse.json(
        { error: 'Document is already being processed' },
        { status: 400 },
      );
    }

    // Create processing job
    const job = await databaseAdapter.createProcessingJob({
      documentId,
      status: 'queued',
      progress: 0,
      chunksProcessed: 0,
      totalChunks: 0,
      config,
      startedAt: new Date(),
    });

    // Update document status
    await databaseAdapter.updateDocumentStatus(documentId, 'processing');

    // Trigger async processing
    // In production, this would be a queue job (SQS, Bull, etc.)
    processDocumentAsync(job.id, documentId, config).catch((error) => {
      console.error('Processing error:', error);
      databaseAdapter.updateProcessingJob(job.id, {
        status: 'error',
        error: error.message,
      });
      databaseAdapter.updateDocumentStatus(documentId, 'error');
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        documentId: job.documentId,
      },
    });
  } catch (error) {
    console.error('Process document error:', error);
    return NextResponse.json(
      { error: 'Failed to start processing' },
      { status: 500 },
    );
  }
}

// Async processing function
async function processDocumentAsync(
  jobId: string,
  documentId: string,
  config: ProcessRequest['config'],
) {
  const { storageAdapter, documentProcessorAdapter, vectorAdapter } =
    await import('@/app/(admin)/admin/ingestion/_lib/adapters');

  try {
    // Get document details
    const document = await databaseAdapter.getDocument(documentId);
    if (!document) throw new Error('Document not found');

    // Download document from S3
    const documentBuffer = await storageAdapter.downloadFile(
      document.metadata?.s3Key || document.path,
    );

    // Validate document
    const validation =
      await documentProcessorAdapter.validateDocument(documentBuffer);
    if (!validation.valid) {
      throw new Error(`Invalid document: ${validation.errors?.join(', ')}`);
    }

    // Update job with total pages
    await databaseAdapter.updateProcessingJob(jobId, {
      status: 'processing',
      metadata: { totalPages: validation.pages },
    });

    // Analyze document structure with Textract
    const documentUrl = await storageAdapter.getFileUrl(
      document.metadata?.s3Key || document.path,
    );

    const structure = await documentProcessorAdapter.analyzeDocument(
      documentUrl,
      {
        extractTables: config.extractTables,
        extractKeyValues: false,
        extractLayout: true,
        ocrEnabled: config.ocrEnabled,
        language: config.language,
      },
    );

    // Chunk the document
    const chunks = await documentProcessorAdapter.chunkDocument(structure, {
      strategy: config.chunkingStrategy,
      maxChunkSize: config.maxChunkSize,
      overlapPercentage: config.overlapPercentage,
      preserveFormatting: config.preserveFormatting,
    });

    // Update total chunks
    await databaseAdapter.updateProcessingJob(jobId, {
      totalChunks: chunks.length,
    });

    // Process chunks and generate embeddings
    const processedChunks = await processChunks(
      chunks,
      document,
      jobId,
      structure,
      config,
    );

    // Add to vector database with hierarchical metadata
    await vectorAdapter.addDocuments(processedChunks);

    // Store chunks in database
    await databaseAdapter.createChunks(
      processedChunks.map((chunk) => ({
        id: chunk.id,
        documentId: document.id,
        jobId,
        content: chunk.content,
        metadata: chunk.metadata,
        createdAt: new Date(),
      })),
    );

    // Update job and document status
    await databaseAdapter.updateProcessingJob(jobId, {
      status: 'completed',
      progress: 100,
      chunksProcessed: chunks.length,
      completedAt: new Date(),
    });

    await databaseAdapter.updateDocumentStatus(documentId, 'completed');
  } catch (error: any) {
    console.error('Processing error:', error);

    await databaseAdapter.updateProcessingJob(jobId, {
      status: 'error',
      error: error.message,
      completedAt: new Date(),
    });

    await databaseAdapter.updateDocumentStatus(documentId, 'error');

    throw error;
  }
}

// Process chunks with hierarchical metadata
async function processChunks(
  chunks: any[],
  document: any,
  jobId: string,
  structure: any,
  config: any,
) {
  const { vectorAdapter } = await import(
    '@/app/(admin)/admin/ingestion/_lib/adapters'
  );
  const processedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Build hierarchical metadata
    const hierarchy = extractHierarchy(chunk, structure);
    const breadcrumb = buildBreadcrumb(hierarchy);

    // Determine content type
    const contentType = determineContentType(chunk.content);

    // Extract keywords and cross-references
    const keywords = extractKeywords(chunk.content);
    const crossReferences = extractCrossReferences(chunk.content);

    // Calculate importance based on heading level
    const importance = calculateImportance(hierarchy, contentType);

    // Generate embedding
    const embedding = await vectorAdapter.generateEmbedding(chunk.content);

    processedChunks.push({
      id: `${document.id}-chunk-${i}`,
      content: chunk.content,
      embedding,
      metadata: {
        // Document identification
        documentId: document.id,
        documentName: document.name,
        documentPath: document.path,

        // Jurisdiction and classification
        jurisdiction: document.metadata?.jurisdiction,
        codeType: document.metadata?.codeType,
        year: document.metadata?.year,
        version: document.metadata?.version,

        // Hierarchical location
        hierarchy,
        breadcrumb,

        // Position information
        pageNumber: chunk.metadata.startPage,
        startPage: chunk.metadata.startPage,
        endPage: chunk.metadata.endPage,
        chunkIndex: i,
        totalChunks: chunks.length,

        // Content classification
        contentType,

        // Relationships
        parentChunkId: i > 0 ? `${document.id}-chunk-${i - 1}` : undefined,
        childChunkIds:
          i < chunks.length - 1 ? [`${document.id}-chunk-${i + 1}`] : [],
        crossReferences,

        // Search enhancement
        keywords,
        importance,

        // Processing metadata
        extractedAt: new Date(),
        processingJobId: jobId,
        confidence: chunk.confidence,
      },
    });

    // Update processing progress
    if (i % 10 === 0) {
      await databaseAdapter.updateProcessingJob(jobId, {
        progress: Math.round((i / chunks.length) * 100),
        chunksProcessed: i,
      });
    }
  }

  return processedChunks;
}

// Helper functions for metadata extraction
function extractHierarchy(chunk: any, structure: any): any {
  // Extract hierarchical information from chunk and document structure
  return {
    title: structure.title,
    chapter: chunk.metadata.section?.match(/Chapter (\d+)/)?.[0],
    section: chunk.metadata.section,
    subsection: chunk.metadata.subsection,
    paragraph: chunk.metadata.paragraph,
  };
}

function buildBreadcrumb(hierarchy: any): string[] {
  const breadcrumb = [];
  if (hierarchy.title) breadcrumb.push(hierarchy.title);
  if (hierarchy.chapter) breadcrumb.push(hierarchy.chapter);
  if (hierarchy.section) breadcrumb.push(hierarchy.section);
  if (hierarchy.subsection) breadcrumb.push(hierarchy.subsection);
  return breadcrumb;
}

function determineContentType(content: string): string {
  if (content.includes('Definition')) return 'definition';
  if (content.includes('Exception')) return 'exception';
  if (content.includes('Table')) return 'table';
  if (content.includes('Figure')) return 'figure';
  if (content.includes('Note')) return 'note';
  if (content.includes('Example')) return 'example';
  return 'regulation';
}

function extractKeywords(content: string): string[] {
  // Simple keyword extraction - in production, use NLP
  const words = content.toLowerCase().split(/\s+/);
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
  ]);

  return [...new Set(words)]
    .filter((word) => word.length > 3 && !stopWords.has(word))
    .slice(0, 10);
}

function extractCrossReferences(content: string): string[] {
  // Extract section references
  const references = content.match(/Section \d+(\.\d+)*/g) || [];
  return [...new Set(references)];
}

function calculateImportance(hierarchy: any, contentType: string): number {
  let importance = 0.5;

  // Higher importance for main sections
  if (!hierarchy.subsection) importance += 0.2;
  if (!hierarchy.section) importance += 0.1;

  // Adjust by content type
  if (contentType === 'definition') importance += 0.1;
  if (contentType === 'regulation') importance += 0.1;

  return Math.min(importance, 1.0);
}
