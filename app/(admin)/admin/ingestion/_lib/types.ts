// Comprehensive metadata structure for chunks
export interface ChunkMetadata {
  // Document identification
  documentId: string;
  documentName: string;
  documentPath: string;

  // Jurisdiction and classification
  jurisdiction?: string;
  codeType?: string;
  year?: number;
  version?: string;

  // Hierarchical location
  hierarchy: {
    title?: string;
    part?: string;
    chapter?: string;
    section?: string;
    subsection?: string;
    paragraph?: string;
  };

  // Breadcrumb trail for navigation
  breadcrumb: string[];

  // Position information
  pageNumber: number;
  startPage: number;
  endPage: number;
  chunkIndex: number;
  totalChunks: number;

  // Content classification
  contentType:
    | 'regulation'
    | 'definition'
    | 'table'
    | 'exception'
    | 'figure'
    | 'note'
    | 'example'
    | 'mixed';

  // Relationships
  parentChunkId?: string;
  childChunkIds?: string[];
  crossReferences?: string[];

  // Search enhancement
  keywords?: string[];
  importance?: number; // 0-1, based on heading level and type

  // Processing metadata
  extractedAt: Date;
  processingJobId: string;
  confidence?: number;
}

// File tree structure for UI
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  size?: number;
  uploadedAt?: Date;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  documentId?: string;
  metadata?: Partial<ChunkMetadata>;
}

// API request/response types
export interface UploadRequest {
  targetFolder: string;
  metadata?: {
    jurisdiction?: string;
    codeType?: string;
    year?: number;
    version?: string;
  };
}

export interface ProcessRequest {
  documentId: string;
  config: {
    chunkingStrategy: 'section' | 'fixed' | 'hybrid';
    maxChunkSize: number;
    overlapPercentage: number;
    extractTables: boolean;
    extractImages: boolean;
    preserveFormatting: boolean;
    ocrEnabled: boolean;
    language: string;
  };
}

export interface JobStatusResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error' | 'paused';
  progress: number;
  chunksProcessed: number;
  totalChunks: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  documentName: string;
  metadata?: {
    pagesProcessed?: number;
    totalPages?: number;
    tablesExtracted?: number;
    sectionsIdentified?: number;
  };
}
