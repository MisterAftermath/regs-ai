# Document Ingestion System

## Overview

This ingestion system is designed to process building code PDF documents and prepare them for use in the AI chatbot's vector database. The system provides a user-friendly interface for uploading, organizing, and processing documents with configurable chunking strategies.

## Architecture

### Technical Stack

- **Frontend**: Next.js with TypeScript
- **Document Processing**: AWS Textract (recommended)
- **Vector Database**: ChromaDB
- **File Storage**: AWS S3

### Key Components

1. **File Explorer** (`_components/file-explorer.tsx`)

   - Hierarchical document organization
   - Visual status indicators
   - File management operations

2. **Upload Zone** (`_components/upload-zone.tsx`)

   - Drag-and-drop PDF uploads
   - Batch processing support
   - Target folder selection

3. **Processing Queue** (`_components/processing-queue.tsx`)

   - Real-time processing status
   - Job management (pause, resume, retry)
   - Error handling and logging

4. **Ingestion Settings** (`_components/ingestion-settings.tsx`)
   - Configurable chunking strategies
   - OCR settings for scanned documents
   - Extraction options (tables, images, formatting)

## Processing Pipeline

1. **Document Upload**

   - PDFs uploaded to S3 with organized folder structure
   - Metadata stored in database

2. **Structure Analysis**

   - AWS Textract analyzes document layout
   - Extracts hierarchical structure (sections, subsections)
   - Identifies tables, images, and special formatting

3. **Intelligent Chunking**

   - **By Section**: Splits at natural boundaries (headings, sections)
   - **Fixed Size**: Equal-sized chunks with token limits
   - **Hybrid**: Combines both approaches for optimal results

4. **Vector Generation**
   - Each chunk processed into embeddings
   - Metadata preserved (source, page, section hierarchy)
   - Stored in ChromaDB with relationships

## Setup Instructions

### Prerequisites

```bash
npm install react-dropzone @radix-ui/react-tabs @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-progress
```

### Environment Variables

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=building-codes-documents
```

### AWS Textract Configuration

1. Create an S3 bucket for document storage
2. Set up IAM roles with Textract permissions
3. Configure SNS topics for async processing notifications

## Usage Guide

### Uploading Documents

1. Navigate to the "Upload" tab
2. Select target folder for organization
3. Drag and drop PDFs or click to browse
4. Review upload queue before processing

### Configuring Processing

1. Go to "Settings" tab
2. Choose chunking strategy based on document type:
   - **Building codes with clear sections**: Use "By Section"
   - **Dense technical manuals**: Use "Hybrid"
   - **Uniform documents**: Use "Fixed Size"
3. Adjust chunk size and overlap for optimal retrieval
4. Enable OCR for scanned documents

### Monitoring Processing

1. View real-time progress in "Processing Queue"
2. Check chunk preview for quality control
3. Review error logs for failed documents
4. Retry or adjust settings as needed

## Best Practices

### Document Organization

- Create folders by jurisdiction (state/city)
- Separate by code type (building, electrical, plumbing)
- Include year/version in folder structure

### Chunking Configuration

- **Overlap**: 10-20% for technical documents
- **Chunk Size**: 500-1000 tokens for detailed content
- **Section-based**: Preferred for hierarchical documents

### Quality Control

- Preview chunks before final processing
- Verify table extraction accuracy
- Check section boundaries preservation
- Test retrieval with sample queries

## API Integration

### Upload Endpoint

```typescript
POST /api/admin/documents/upload
Content-Type: multipart/form-data

{
  file: File,
  targetFolder: string,
  metadata: {
    jurisdiction: string,
    codeType: string,
    year: number
  }
}
```

### Processing Endpoint

```typescript
POST /api/admin/documents/process
Content-Type: application/json

{
  documentId: string,
  config: {
    chunkingStrategy: "section" | "fixed" | "hybrid",
    maxChunkSize: number,
    overlapPercentage: number,
    extractTables: boolean,
    extractImages: boolean,
    ocrEnabled: boolean
  }
}
```

### Status Endpoint

```typescript
GET /api/admin/documents/status/:jobId

Response: {
  status: "queued" | "processing" | "completed" | "error",
  progress: number,
  chunksProcessed: number,
  totalChunks: number,
  error?: string
}
```

## Troubleshooting

### Common Issues

1. **Large PDF Processing Timeout**

   - Split into smaller documents
   - Increase Lambda timeout
   - Use async processing with SNS

2. **Poor Chunk Quality**

   - Adjust chunking strategy
   - Increase overlap percentage
   - Enable formatting preservation

3. **OCR Accuracy Issues**
   - Ensure high-quality scans (300+ DPI)
   - Pre-process images for clarity
   - Use appropriate language settings

## Future Enhancements

1. **Multi-format Support**

   - Word documents (.docx)
   - HTML documentation
   - Markdown files

2. **Advanced Processing**

   - Custom extraction rules
   - Table-to-structured-data conversion
   - Cross-reference linking

3. **Collaboration Features**
   - Multi-user review workflow
   - Chunk annotation system
   - Version control for documents
