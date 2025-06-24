/**
 * Building Code Agent Configuration
 *
 * Central configuration for all external services and settings.
 * Replace placeholder values with your actual credentials and endpoints.
 */

export const config = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    models: {
      planner: 'gpt-4o', // Model for clarification/planning phase
      retriever: 'gpt-4o-mini', // Model for retrieval phase
      synthesizer: 'gpt-4o', // Model for synthesis phase
      embeddings: 'text-embedding-ada-002',
      verifier: 'gpt-3.5-turbo', // Model for semantic verification
    },
    temperature: {
      planner: 0.3, // Some creativity for asking clarifying questions
      retriever: 0, // Precise for search
      synthesizer: 0.1, // Mostly precise for final answer
      verifier: 0, // Deterministic for verification
    },
  },

  // Vector Database Configuration
  vectorDB: {
    // TODO: Replace with your actual vector DB configuration
    provider: 'chroma', // or 'pinecone', 'weaviate', etc.

    // Namespace configuration for separating content types
    namespaces: {
      buildingCodes: 'building-codes-general', // General building codes
      userDocuments: 'user-documents', // User-uploaded documents
      companyExceptions: 'company-exceptions', // Company-specific exceptions
    },

    // Connection settings
    connection: {
      // TODO: Add your vector DB connection details
      host: process.env.VECTOR_DB_HOST || 'localhost',
      port: process.env.VECTOR_DB_PORT || '8000',
      apiKey: process.env.VECTOR_DB_API_KEY,
    },
  },

  // S3 Configuration for PDF Storage
  s3: {
    // TODO: Add your AWS S3 credentials
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',

    buckets: {
      buildingCodes:
        process.env.S3_BUILDING_CODES_BUCKET || 'building-codes-pdfs',
      userDocuments: process.env.S3_USER_DOCS_BUCKET || 'user-uploaded-pdfs',
    },

    // URL patterns for generating presigned URLs
    urlExpiration: 3600, // 1 hour
    cdnBaseUrl: process.env.CDN_BASE_URL, // Optional: CloudFront distribution
  },

  // PDF Processing Configuration
  pdfProcessing: {
    // TODO: Configure PDF search service
    searchProvider: 'elasticsearch', // or 'algolia', 'custom', etc.
    highlightColor: '#FFEB3B',
    maxHighlightsPerPage: 10,

    // Fuzzy search settings
    fuzzySearch: {
      minSimilarity: 0.5, // Minimum similarity score to consider
      maxCandidates: 5, // Max candidates to verify per citation
    },

    // Semantic verification settings
    semanticVerification: {
      enabled: true,
      model: 'gpt-3.5-turbo', // Fast model for verification
      confidenceThreshold: 0.7,
    },

    // Elasticsearch configuration (if using)
    elasticsearch: {
      node: process.env.ELASTICSEARCH_NODE,
      apiKey: process.env.ELASTICSEARCH_API_KEY,
      index: 'building-codes-pdfs',
    },
  },

  // Pipeline Configuration
  pipeline: {
    // Maximum rounds of clarification before proceeding
    maxClarificationRounds: 3,

    // Timeouts for each phase (in seconds)
    timeouts: {
      clarify: 30,
      retrieve: 45,
      verify: 60,
      synthesize: 30,
    },

    // Retry configuration
    retries: {
      enabled: true,
      maxAttempts: 3,
      backoffMultiplier: 2,
    },
  },

  // Response Configuration
  response: {
    // Include source citations in response
    includeSources: true,

    // Maximum number of sources to include
    maxSources: 5,

    // Format for citations
    citationFormat: 'inline', // or 'footnote', 'endnote'

    // Enable confidence scores
    includeConfidence: true,
  },

  // Feature Flags
  features: {
    // Enable user document search
    searchUserDocuments: true,

    // Enable PDF highlighting
    pdfHighlighting: true,

    // Enable interactive clarification
    interactiveClarification: true,

    // Enable caching
    caching: {
      enabled: true,
      ttl: 3600, // 1 hour
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    includeTimestamps: true,
    logToFile: false,
    filePath: './logs/building-code-agent.log',
  },
};

/**
 * TODO LIST FOR IMPLEMENTATION:
 *
 * 1. VECTOR DATABASE SETUP:
 *    - [ ] Choose and set up vector database (Chroma, Pinecone, etc.)
 *    - [ ] Create namespaces for building codes and user documents
 *    - [ ] Upload building code PDFs and create embeddings
 *    - [ ] Implement document upload pipeline for user files
 *
 * 2. S3 CONFIGURATION:
 *    - [ ] Create AWS account and S3 buckets
 *    - [ ] Set up IAM roles with appropriate permissions
 *    - [ ] Upload building code PDFs to S3
 *    - [ ] Implement presigned URL generation
 *    - [ ] Optional: Set up CloudFront CDN for faster access
 *
 * 3. PDF SEARCH INFRASTRUCTURE:
 *    - [ ] Choose PDF search solution (Elasticsearch, Algolia, etc.)
 *    - [ ] Index PDFs with page-level granularity
 *    - [ ] Implement highlight extraction logic
 *    - [ ] Create API endpoints for PDF viewing with highlights
 *
 * 4. ENVIRONMENT VARIABLES:
 *    Add these to your .env file:
 *    - OPENAI_API_KEY
 *    - VECTOR_DB_HOST
 *    - VECTOR_DB_PORT
 *    - VECTOR_DB_API_KEY
 *    - AWS_ACCESS_KEY_ID
 *    - AWS_SECRET_ACCESS_KEY
 *    - AWS_REGION
 *    - S3_BUILDING_CODES_BUCKET
 *    - S3_USER_DOCS_BUCKET
 *    - ELASTICSEARCH_NODE (if using)
 *    - ELASTICSEARCH_API_KEY (if using)
 *
 * 5. DATA PREPARATION:
 *    - [ ] Collect municipal building codes in PDF format
 *    - [ ] Create metadata schema for documents
 *    - [ ] Implement chunking strategy for large documents
 *    - [ ] Design citation format for consistent referencing
 *
 * 6. UI COMPONENTS:
 *    - [ ] Create "View Sources" button component
 *    - [ ] Implement PDF viewer with highlight support
 *    - [ ] Add confidence score indicators
 *    - [ ] Create feedback mechanism for responses
 *
 * 7. TESTING:
 *    - [ ] Create test dataset with known Q&A pairs
 *    - [ ] Implement integration tests for each phase
 *    - [ ] Test with real building code queries
 *    - [ ] Verify citation accuracy
 */

// Validate configuration on load
export function validateConfig() {
  const required = [
    'openai.apiKey',
    'vectorDB.connection.host',
    's3.accessKeyId',
    's3.secretAccessKey',
  ];

  const missing = required.filter((path) => {
    const value = path
      .split('.')
      .reduce((obj, key) => obj?.[key], config as any);
    return !value;
  });

  if (missing.length > 0) {
    console.warn('⚠️  Missing configuration values:', missing);
    console.warn('   Please update config.ts or set environment variables');
  }

  return missing.length === 0;
}
