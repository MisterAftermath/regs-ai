export {
  databaseAdapter,
  type DocumentRecord,
  type ProcessingJob,
  type ProcessingConfig,
  type ChunkRecord,
} from './database.adapter';
export {
  storageAdapter,
  type StorageObject,
  type UploadOptions,
} from './storage.adapter';
export {
  vectorAdapter,
  type VectorDocument,
  type VectorSearchResult,
  type CollectionInfo,
} from './vector.adapter';
export {
  documentProcessorAdapter,
  type DocumentStructure,
  type DocumentChunk,
  type ProcessingOptions,
  type ChunkingOptions,
} from './document-processor.adapter';
