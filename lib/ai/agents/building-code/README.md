# Building Code Agent - Pipeline Architecture

A specialized AI agent for answering questions about building codes, zoning regulations, and land use requirements using a multi-phase pipeline approach.

## Overview

The Building Code Agent uses a sophisticated pipeline architecture to provide accurate, verified answers about building codes. The pipeline consists of five phases:

**Clarify → Retrieve → Verify → Synthesize → Review**

This architecture ensures high-quality responses by:

- Extracting key information from user queries
- Searching multiple data sources (general codes + user documents)
- Verifying citations against source PDFs
- Synthesizing comprehensive responses with confidence scores
- Providing source references for user review

## Pipeline Phases

### 1. Clarify

- Analyzes user queries to extract municipality, address, property type, etc.
- Identifies missing critical information
- Generates clarifying questions when needed

### 2. Retrieve

- Searches vector database across multiple namespaces:
  - General building codes
  - User-uploaded documents
  - Company-specific exceptions
- Returns relevant documents with similarity scores

### 3. Verify

- Validates citations by searching in source PDFs
- Extracts exact text with page coordinates for highlighting
- Generates presigned URLs for PDF viewing
- Assigns confidence scores to each citation

### 4. Synthesize

- Creates comprehensive response using verified citations
- Distinguishes between general codes and company policies
- Includes inline citations and confidence indicators
- Structures response with clear sections

### 5. Review (Future)

- Presents sources with "View Sources" button
- Shows PDF highlights for each citation
- Collects user feedback for continuous improvement

## Architecture

```
lib/ai/agents/building-code/
├── index.ts              # Main export and factory
├── agent.ts              # Pipeline-based agent implementation
├── config.ts             # Centralized configuration
├── types.ts              # TypeScript interfaces
├── pipeline/             # Pipeline phase implementations
│   ├── index.ts         # Pipeline orchestrator
│   ├── clarify.ts       # Clarification phase
│   ├── retrieve.ts      # Retrieval phase
│   ├── verify.ts        # Verification phase
│   └── synthesize.ts    # Synthesis phase
├── tools/                # Legacy LangChain tools (for mock)
├── prompts.ts            # System prompts and messages
├── wrapper.ts            # Vercel AI SDK compatibility
├── mock.ts               # Mock implementation for testing
└── README.md             # This file
```

## Configuration

All configuration is centralized in `config.ts`. Key settings include:

- **OpenAI Models**: Different models for each phase
- **Vector Database**: Namespaces, connection settings
- **S3 Storage**: Buckets for PDF storage
- **PDF Processing**: Search service configuration
- **Pipeline Settings**: Timeouts, retries, features

See `config.ts` for the complete TODO list of required setup.

## Usage

### Basic Usage

```typescript
import { createBuildingCodeAgent } from "@/lib/ai/agents/building-code";

// Production mode (uses real pipeline)
const agent = createBuildingCodeAgent({ useMock: false });

// Development mode (uses mock data)
const agent = createBuildingCodeAgent({ useMock: true });
```

### With Vercel AI SDK

```typescript
import { createBuildingCodeAgent, createBuildingCodeLanguageModel } from '@/lib/ai/agents/building-code';

const agent = createBuildingCodeAgent({ useMock: false });
const model = createBuildingCodeLanguageModel(agent);

const result = await streamText({
  model,
  messages: [...],
});
```

### Advanced Options

```typescript
const result = await agent.invoke({
  messages: [...],
  options: {
    skipClarification: false,  // Skip clarify phase
    includeConfidence: true,   // Include confidence scores
    maxSources: 5             // Maximum sources to return
  }
});
```

## Implementation Status

### ✅ Implemented

- Pipeline architecture with all 5 phases defined
- Clarification phase with query analysis
- Multi-namespace retrieval (mock data)
- Citation verification logic (mock PDF search)
- Synthesis with confidence scoring
- Source reference generation
- Vercel AI SDK integration
- Comprehensive configuration system

### 🚧 TODO (See config.ts for details)

1. **Vector Database Setup**

   - Choose provider (Chroma, Pinecone, etc.)
   - Create namespaces
   - Upload building codes
   - Implement user document pipeline

2. **S3 Configuration**

   - Create AWS buckets
   - Upload PDFs
   - Implement presigned URLs

3. **PDF Search**

   - Choose search provider
   - Index PDFs
   - Implement highlighting

4. **UI Components**
   - "View Sources" button
   - PDF viewer with highlights
   - Confidence indicators

## Example Queries

- "What are the setback requirements for a property at 123 Main St, Houston?"
- "What's the minimum lot size for R-1 zoning in Houston?"
- "Our company has variance policies for Houston projects - what are the adjusted requirements?"
- "Show me all height restrictions for commercial properties in Dallas"

## Development

### Running Tests

```bash
# Uses mock implementation automatically
npm test
```

### Debugging

Set logging level in config or environment:

```bash
LOG_LEVEL=debug npm run dev
```

This will show:

- Phase timings
- Document retrieval details
- Verification results
- Full pipeline state

## Architecture Benefits

1. **Accuracy**: Multi-phase verification ensures accurate responses
2. **Transparency**: Clear source attribution and confidence scores
3. **Flexibility**: Each phase can be independently updated
4. **Scalability**: Easy to add new data sources or verification methods
5. **User Trust**: PDF verification and source viewing builds confidence

## Future Enhancements

- [ ] Interactive clarification UI
- [ ] Real-time PDF highlighting
- [ ] Historical code version tracking
- [ ] Permit requirement analysis
- [ ] Code compliance checking
- [ ] Multi-language support
- [ ] Advanced caching strategies

## Troubleshooting

### "Could not connect to vector database"

- Ensure your vector database is running
- Check connection credentials

### "No results found"

- Verify documents are properly indexed
- Check municipality spelling
- Try broader search terms

### "Invalid API key"

- Set `OPENAI_API_KEY` in your environment
- Verify key has appropriate permissions
