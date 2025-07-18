/**
 * TypeScript types and interfaces for the Building Code Agent
 */

import type { CoreMessage } from 'ai';

/**
 * Pipeline phase definitions
 */
export type PipelinePhase =
  | 'clarify'
  | 'retrieve'
  | 'verify'
  | 'synthesize'
  | 'review';

/**
 * State that flows through the pipeline
 */
export interface PipelineState {
  // Original user query
  originalQuery: string;

  // Clarified query with extracted parameters
  clarifiedQuery: {
    question: string;
    municipality?: string;
    address?: string;
    propertyType?: string;
    specificCodes?: string[];
    context?: Record<string, any>;
  };

  // Retrieved documents
  retrievedDocuments: RetrievedDocument[];

  // Verified citations
  verifiedCitations: VerifiedCitation[];

  // Synthesized response
  synthesizedResponse?: {
    content: string;
    confidence: number;
    sources: Source[];
  };

  // Metadata
  metadata: {
    startTime: number;
    phaseTimings: Record<PipelinePhase, number>;
    errors: Array<{ phase: PipelinePhase; error: string }>;
  };
}

/**
 * Document retrieved from vector store
 */
export interface RetrievedDocument {
  id: string;
  content: string;
  metadata: BuildingCodeMetadata;
  score: number;
  source: 'general' | 'user' | 'company';
}

/**
 * Verified citation with source reference
 */
export interface VerifiedCitation {
  citation: string;
  content: string;
  isValid: boolean;
  confidence: number;
  source: {
    documentId: string;
    page?: number;
    coordinates?: { x: number; y: number; width: number; height: number };
    s3Url?: string;
  };
}

/**
 * Source reference for user review
 */
export interface Source {
  title: string;
  citation: string;
  excerpt: string;
  documentUrl: string;
  page?: number;
  highlights?: Array<{
    text: string;
    coordinates: { x: number; y: number; width: number; height: number };
  }>;
}

/**
 * Phase-specific agent interfaces
 */
export interface PhaseAgent<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

export interface ClarifyAgent
  extends PhaseAgent<
    { query: string; history: CoreMessage[] },
    PipelineState['clarifiedQuery']
  > {}

export interface RetrieveAgent
  extends PhaseAgent<
    { clarifiedQuery: PipelineState['clarifiedQuery'] },
    RetrievedDocument[]
  > {}

export interface VerifyAgent
  extends PhaseAgent<
    { documents: RetrievedDocument[]; query: PipelineState['clarifiedQuery'] },
    VerifiedCitation[]
  > {}

export interface SynthesizeAgent
  extends PhaseAgent<
    {
      query: PipelineState['clarifiedQuery'];
      citations: VerifiedCitation[];
      documents: RetrievedDocument[];
    },
    PipelineState['synthesizedResponse']
  > {}

/**
 * Metadata structure for building code documents
 */
export interface BuildingCodeMetadata {
  municipality: string;
  state?: string;
  chapter: string;
  section: string;
  subsection?: string;
  title: string;
  effectiveDate?: string;
  lastUpdated?: string;
  documentType?: 'building-code' | 'zoning' | 'ordinance' | 'amendment';
  tags?: string[];
  pdfUrl?: string;
  pageRange?: { start: number; end: number };
}

/**
 * Configuration for the Building Code Agent
 */
export interface BuildingCodeConfig {
  plannerModel?: string;
  embeddingModel?: string;
  temperature?: number;
  maxTokens?: number;
  verbose?: boolean;
  useMock?: boolean;
  enableCaching?: boolean;
  enableStreaming?: boolean;
}

/**
 * Main Building Code Agent interface
 */
export interface BuildingCodeAgent {
  invoke(params: {
    messages: CoreMessage[];
    options?: {
      skipClarification?: boolean;
      includeConfidence?: boolean;
      maxSources?: number;
    };
  }): Promise<{ content: string; sources?: Source[] }>;

  stream?(params: {
    messages: CoreMessage[];
    options?: {
      skipClarification?: boolean;
      includeConfidence?: boolean;
      maxSources?: number;
    };
  }): AsyncGenerator<string, void, unknown>;
}

/**
 * Tool result types
 */
export interface SearchResult {
  documents: RetrievedDocument[];
  totalResults: number;
  searchTime: number;
}

export interface ZoningInfo {
  address: string;
  zoning: string;
  restrictions: {
    maxHeight?: number;
    minLotSize?: number;
    maxCoverage?: number;
    setbacks?: {
      front: number;
      rear: number;
      side: number;
    };
  };
}

/**
 * Error types
 */
export class BuildingCodeError extends Error {
  constructor(
    message: string,
    public phase: PipelinePhase,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'BuildingCodeError';
  }
}
