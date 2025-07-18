import { tool } from 'ai';
import { z } from 'zod';
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import { getJurisdictionCollection } from '../jurisdictions';

const COLLECTION = 'regsai';
const EMBED_MODEL = 'text-embedding-ada-002';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize ChromaDB client
// IMPORTANT: This connects to the IP address you provided.
const client = new ChromaClient({
  path: 'http://18.219.197.229:8000',
});

export const searchChromaDb = tool({
  description:
    'Search the ChromaDB vector database for building codes and regulations. Use this to answer any user questions about regulations for specific jurisdictions.',
  parameters: z.object({
    query: z.string().describe('The search query to find relevant documents.'),
    jurisdictionId: z
      .string()
      .optional()
      .describe(
        'The ID of the jurisdiction to search (e.g., "houston", "austin"). If not provided, uses the default jurisdiction.',
      ),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe('The maximum number of relevant documents to return.'),
  }),
  execute: async ({ query, jurisdictionId, limit }) => {
    // Get the collection name based on jurisdiction
    const collectionName = getJurisdictionCollection(jurisdictionId);

    console.log(
      `Searching ChromaDB collection "${collectionName}" with query: "${query}"`,
    );

    try {
      // 1. Get collection
      const collection = await client.getCollection({ name: collectionName });

      // 2. Embed the question using OpenAI
      const embeddingResponse = await openai.embeddings.create({
        model: EMBED_MODEL,
        input: query,
      });
      const queryEmbedding = embeddingResponse.data[0].embedding;

      // 3. Retrieve top-k relevant chunks using queryEmbeddings
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ['documents', 'metadatas'],
      });

      if (!results || !results.documents || results.documents[0].length === 0) {
        return { results: 'No relevant documents found for the query.' };
      }

      // Format results for the LLM
      const formattedResults = results.documents[0].map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
      }));

      return {
        results: formattedResults,
      };
    } catch (error) {
      console.error('Error executing searchChromaDb tool:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      if (
        errorMessage.includes('Failed to connect') ||
        errorMessage.includes('fetch failed')
      ) {
        return {
          error:
            'Could not connect to ChromaDB. Please ensure it is running and accessible at http://18.219.197.229:8000.',
        };
      }
      return {
        error: 'An unexpected error occurred while searching the database.',
      };
    }
  },
});
