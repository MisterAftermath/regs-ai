# Deploying ChromaDB Agent to Vercel

Since Vercel is a serverless platform, you can't run a persistent ChromaDB server directly on it. Here are the best solutions to deploy your regulatory AI assistant:

## 📂 Files Modified for Chroma Model Integration

Understanding the codebase structure and what was changed to add the new Chroma DB Agent model:

### Core Model Definition

- **`lib/ai/models.ts`**
  - **What changed**: Added new model object to `chatModels` array
  - **Purpose**: Defines the model metadata (id, name, description) that appears in the UI
  - **Code added**: `{ id: 'chat-model-chroma', name: 'Chroma DB Agent', description: 'AI agent with access to your Chroma vector database' }`

### Agent Implementation

- **`lib/ai/chroma-agent.ts`** _(NEW FILE)_
  - **What it does**: Complete ChromaDB + OpenAI agent implementation
  - **Purpose**: Handles vector search, document retrieval, and response generation
  - **Key features**: Environment-aware configuration, streaming support, error handling
  - **Integration**: Wraps your existing Python logic in AI SDK-compatible format

### Provider Configuration

- **`lib/ai/providers.ts`**
  - **What changed**: Added `'chat-model-chroma': createChromaLanguageModel(createChromaAgent())` to both test and production configurations
  - **Purpose**: Registers the new model with the AI SDK provider system
  - **Why needed**: AI SDK needs to know how to instantiate and use your custom model

### System Prompts

- **`lib/ai/prompts.ts`**
  - **What changed**: Added specific case for `'chat-model-chroma'` in `systemPrompt` function
  - **Purpose**: Provides context-specific instructions for the regulatory AI assistant
  - **Content**: Specialized prompt about Houston land development regulations with citation requirements

### API Integration

- **`app/(chat)/api/chat/route.ts`**
  - **What changed**: Updated `experimental_activeTools` logic to handle Chroma model
  - **Purpose**: Configures which tools are available for each model type
  - **Logic**: Chroma agent gets empty tools array since it handles tools internally

### Schema Validation

- **`app/(chat)/api/chat/schema.ts`**
  - **What changed**: Added `'chat-model-chroma'` to the `selectedChatModel` enum
  - **Purpose**: Validates API requests to ensure only valid model IDs are accepted
  - **Security**: Prevents invalid model selections from reaching the API

### User Permissions

- **`lib/ai/entitlements.ts`**
  - **What changed**: Added `'chat-model-chroma'` to both `guest` and `regular` user arrays
  - **Purpose**: Controls which models are available to different user types
  - **Access control**: Determines who can see and use the Chroma DB Agent

### Testing Support

- **`tests/helpers.ts`**
  - **What changed**: Added `'chat-model-chroma'` to TypeScript type definition
  - **Purpose**: Allows tests to use the new model in test scenarios
  - **Type safety**: Ensures test code can reference the new model without TypeScript errors

### Deployment Configuration

- **`vercel.json`** _(NEW FILE)_
  - **What it does**: Configures Vercel deployment settings
  - **Purpose**: Sets function timeout to 60s for vector search operations
  - **Why needed**: Vector database queries can take longer than default 10s limit

### Documentation

- **`VERCEL-DEPLOYMENT.md`** _(THIS FILE)_
  - **What it does**: Complete deployment guide for production environments
  - **Purpose**: Instructions for migrating from local ChromaDB to cloud services
  - **Covers**: Multiple deployment options, migration scripts, troubleshooting

## 🔄 How to Add New Models (Following This Pattern)

Based on this Chroma integration, here's the complete process to add any new AI model:

### 1. Model Definition (`lib/ai/models.ts`)

```typescript
{
  id: 'your-model-id',
  name: 'Display Name',
  description: 'User-facing description',
}
```

### 2. Model Implementation (`lib/ai/your-agent.ts`)

```typescript
export function createYourLanguageModel(): LanguageModelV1 {
  return {
    specificationVersion: "v1",
    provider: "your-provider",
    modelId: "your-model-id",
    defaultObjectGenerationMode: "json",
    async doGenerate({ prompt }) {
      /* your logic */
    },
    async doStream({ prompt }) {
      /* your streaming logic */
    },
  };
}
```

### 3. Provider Registration (`lib/ai/providers.ts`)

```typescript
languageModels: {
  // ... existing models
  'your-model-id': createYourLanguageModel(),
}
```

### 4. System Prompt (`lib/ai/prompts.ts`)

```typescript
} else if (selectedChatModel === 'your-model-id') {
  return `Your model-specific system prompt`;
```

### 5. API Configuration (`app/(chat)/api/chat/route.ts`)

```typescript
experimental_activeTools:
  selectedChatModel === 'your-model-id'
    ? ['your', 'specific', 'tools']
    : // other model logic
```

### 6. Schema Validation (`app/(chat)/api/chat/schema.ts`)

```typescript
selectedChatModel: z.enum(['chat-model', 'chat-model-reasoning', 'chat-model-chroma', 'your-model-id']),
```

### 7. User Permissions (`lib/ai/entitlements.ts`)

```typescript
availableChatModelIds: ['chat-model', 'chat-model-reasoning', 'chat-model-chroma', 'your-model-id'],
```

### 8. Test Support (`tests/helpers.ts`)

```typescript
chatModel?: 'chat-model' | 'chat-model-reasoning' | 'chat-model-chroma' | 'your-model-id';
```

## 🎯 Key Insights for Future Model Development

### Required Files (Must modify these 8 files for any new model):

1. **Models definition** - UI metadata
2. **Agent implementation** - Core logic
3. **Provider registration** - AI SDK integration
4. **System prompts** - Model-specific instructions
5. **API configuration** - Request handling
6. **Schema validation** - Input validation
7. **User permissions** - Access control
8. **Test support** - Testing capability

### Optional Files (Modify as needed):

- **Deployment config** - If special requirements
- **Documentation** - User/developer guides
- **Migration scripts** - Data transfer tools

### Architecture Pattern:

1. **Separation of concerns**: Agent logic separate from AI SDK wrapper
2. **Environment awareness**: Different configs for dev/prod
3. **Error handling**: Graceful degradation and user feedback
4. **Streaming support**: Real-time response delivery
5. **Type safety**: Full TypeScript coverage

This pattern ensures consistent integration and makes adding new models straightforward! 🚀

## 🌟 Option 1: Chroma Cloud (Recommended)

The easiest and most reliable solution is to use Chroma's hosted cloud service.

### Step 1: Sign up for Chroma Cloud

1. Visit [Chroma Cloud](https://www.trychroma.com/cloud) and create an account
2. Create a new workspace/tenant
3. Get your API key and endpoint URL

### Step 2: Migrate Your Data

First, make sure your local ChromaDB is running:

```bash
chroma run --path ./chroma
```

Then create a migration script `migrate-to-cloud.js`:

```javascript
const { ChromaClient } = require("chromadb");

async function migrateToCloud() {
  // Local client
  const localClient = new ChromaClient({
    path: "http://localhost:8000",
  });

  // Cloud client
  const cloudClient = new ChromaClient({
    path: "YOUR_CHROMA_CLOUD_URL",
    auth: {
      provider: "token",
      credentials: "YOUR_CHROMA_CLOUD_API_KEY",
    },
  });

  // Get local collection
  const localCollection = await localClient.getCollection({ name: "regsai" });

  // Create cloud collection
  const cloudCollection = await cloudClient.createCollection({
    name: "regsai",
  });

  // Get all data
  const results = await localCollection.get({
    include: ["embeddings", "documents", "metadatas"],
  });

  console.log(`Migrating ${results.ids.length} documents...`);

  // Upload in batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < results.ids.length; i += BATCH_SIZE) {
    const batch = {
      ids: results.ids.slice(i, i + BATCH_SIZE),
      embeddings: results.embeddings.slice(i, i + BATCH_SIZE),
      documents: results.documents.slice(i, i + BATCH_SIZE),
      metadatas: results.metadatas.slice(i, i + BATCH_SIZE),
    };

    await cloudCollection.add(batch);
    console.log(`Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}`);
  }

  console.log("Migration complete!");
}

migrateToCloud().catch(console.error);
```

Run the migration:

```bash
node migrate-to-cloud.js
```

### Step 3: Update Environment Variables

Add to your Vercel environment variables:

```env
OPENAI_API_KEY=your_openai_api_key
CHROMA_CLOUD_API_KEY=your_chroma_cloud_api_key
CHROMA_CLOUD_URL=your_chroma_cloud_url
NODE_ENV=production
```

### Step 4: Deploy to Vercel

```bash
vercel --prod
```

## 🏗️ Option 2: External ChromaDB Server

Host ChromaDB on a separate service that supports persistent storage.

### Railway Deployment

1. **Create Railway Account** at [railway.app](https://railway.app)

2. **Create New Project** and add a service

3. **Deploy ChromaDB**:

   - Use Docker deployment
   - Dockerfile:

   ```dockerfile
   FROM chromadb/chroma:latest
   EXPOSE 8000
   CMD ["chroma", "run", "--host", "0.0.0.0", "--port", "8000"]
   ```

4. **Upload Your Data**:

   - Use Railway's volume mounting
   - Or migrate data via API after deployment

5. **Configure Environment Variables**:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   CHROMA_SERVER_URL=https://your-railway-app.railway.app
   NODE_ENV=production
   ```

### Render Deployment

1. **Create Render Account** at [render.com](https://render.com)

2. **Create Web Service**:

   - Runtime: Docker
   - Dockerfile same as above
   - Add persistent disk for data storage

3. **Configure Environment Variables** in Render dashboard

## 🔄 Option 3: Alternative Vector Databases

Switch to a Vercel-native vector database solution.

### Supabase Vector (pgvector)

1. **Setup Supabase**:

   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create Vector Table**:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;

   CREATE TABLE documents (
     id SERIAL PRIMARY KEY,
     content TEXT,
     embedding VECTOR(1536),
     metadata JSONB
   );

   CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);
   ```

3. **Update Agent Implementation**:

   ```typescript
   import { createClient } from "@supabase/supabase-js";

   const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_ANON_KEY!
   );

   // Replace ChromaDB queries with Supabase
   const { data } = await supabase.rpc("match_documents", {
     query_embedding: queryEmbedding,
     match_threshold: 0.8,
     match_count: 3,
   });
   ```

### Pinecone

1. **Setup Pinecone**:

   ```bash
   npm install @pinecone-database/pinecone
   ```

2. **Create Index** in Pinecone dashboard

3. **Update Agent**:

   ```typescript
   import { Pinecone } from "@pinecone-database/pinecone";

   const pc = new Pinecone({
     apiKey: process.env.PINECONE_API_KEY!,
   });

   const index = pc.index("regsai");

   // Query similar vectors
   const results = await index.query({
     vector: queryEmbedding,
     topK: 3,
     includeMetadata: true,
   });
   ```

## 🚀 Deployment Steps (Option 1 - Chroma Cloud)

### 1. Environment Setup

In your Vercel dashboard, add these environment variables:

```env
OPENAI_API_KEY=sk-...
CHROMA_CLOUD_API_KEY=your-chroma-key
CHROMA_CLOUD_URL=https://api.trychroma.com
NODE_ENV=production
```

### 2. Verify Configuration

Your `lib/ai/chroma-agent.ts` is already configured to handle different environments automatically.

### 3. Deploy

```bash
# Deploy to Vercel
vercel --prod

# Or connect your GitHub repo to Vercel for automatic deployments
```

### 4. Test Production

1. Visit your deployed app
2. Select "Chroma DB Agent" from the model selector
3. Ask a question about Houston regulations
4. Verify it returns properly cited responses

## 🔧 Troubleshooting

### Common Issues

**"Could not connect to ChromaDB"**

- Verify environment variables are set in Vercel dashboard
- Check that your cloud ChromaDB service is running
- Test connectivity from your local environment first

**"No results returned"**

- Ensure data migration completed successfully
- Verify collection name matches (`regsai`)
- Check that embeddings were preserved during migration

**Vercel Function Timeout**

- Increase function timeout in `vercel.json`:

```json
{
  "functions": {
    "app/(chat)/api/chat/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### Testing Locally First

Before deploying, test with cloud ChromaDB locally:

```bash
# Set environment variables
export CHROMA_CLOUD_API_KEY=your_key
export CHROMA_CLOUD_URL=your_url
export NODE_ENV=production

# Run locally
npm run dev
```

## 📊 Cost Considerations

| Option          | Cost          | Complexity | Reliability |
| --------------- | ------------- | ---------- | ----------- |
| Chroma Cloud    | ~$20-50/month | Low        | High        |
| Railway/Render  | ~$5-20/month  | Medium     | Medium      |
| Supabase Vector | ~$25/month    | High       | High        |
| Pinecone        | ~$70/month    | Medium     | High        |

## 🎯 Recommendation

For your Houston regulatory AI assistant, I recommend **Chroma Cloud** because:

- ✅ Minimal code changes required
- ✅ Managed service (no server maintenance)
- ✅ Built-in scaling and backups
- ✅ Native ChromaDB compatibility
- ✅ Reasonable pricing for your use case

Your app is already configured to work with Chroma Cloud - just migrate your data and set the environment variables!
