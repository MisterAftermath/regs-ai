import type {
  LanguageModelV1,
  LanguageModelV1StreamPart,
} from '@ai-sdk/provider';
import type { CoreMessage } from 'ai';
import type { UIMessage } from 'ai';
import OpenAI from 'openai';
import { ChromaClient } from 'chromadb';

// ─── CONFIG ────────────────────────────────────────────────────────────────
const COLLECTION = 'regsai';
const EMBED_MODEL = 'text-embedding-ada-002';
const CHAT_MODEL = 'gpt-4o';
const TOP_K = 3;

// ChromaDB Configuration for different environments
const getChromaConfig = () => {
  // Production: Use Chroma Cloud or external server
  if (process.env.NODE_ENV === 'production') {
    if (process.env.CHROMA_CLOUD_API_KEY) {
      // Chroma Cloud configuration
      return {
        path: process.env.CHROMA_CLOUD_URL || 'https://api.trychroma.com',
        auth: {
          provider: 'token',
          credentials: process.env.CHROMA_CLOUD_API_KEY,
        },
      };
    } else if (process.env.CHROMA_SERVER_URL) {
      // External ChromaDB server
      return {
        path: process.env.CHROMA_SERVER_URL,
        auth: process.env.CHROMA_SERVER_AUTH
          ? {
              provider: 'basic',
              credentials: process.env.CHROMA_SERVER_AUTH,
            }
          : undefined,
      };
    }
  }

  // Development: Use local ChromaDB
  return {
    path: 'http://localhost:8000',
  };
};
// ─── END CONFIG ────────────────────────────────────────────────────────────

// Define the interface for your Langchain agent
export interface ChromaAgent {
  invoke: (input: { messages: UIMessage[] }) => Promise<{ content: string }>;
  stream?: (input: { messages: UIMessage[] }) => AsyncGenerator<
    string,
    void,
    unknown
  >;
}

// Helper function to convert AI SDK prompt to UIMessage format
function convertPromptToMessages(prompt: CoreMessage[]): UIMessage[] {
  return prompt.map((message, index) => ({
    id: `msg-${index}`,
    role: message.role as 'user' | 'assistant' | 'system',
    content: Array.isArray(message.content)
      ? message.content
          .map((part: any) => {
            if (part.type === 'text') {
              return part.text;
            }
            return '[Non-text content]';
          })
          .join(' ')
      : message.content,
    parts: Array.isArray(message.content)
      ? message.content.map((part: any) => ({
          type: 'text' as const,
          text: part.type === 'text' ? part.text : '[Non-text content]',
        }))
      : [
          {
            type: 'text' as const,
            text: message.content,
          },
        ],
  }));
}

// Custom language model wrapper for Chroma DB agent
export function createChromaLanguageModel(agent: ChromaAgent): LanguageModelV1 {
  return {
    specificationVersion: 'v1',
    provider: 'chroma-agent',
    modelId: 'chroma-db-agent',
    defaultObjectGenerationMode: 'json',

    async doGenerate({ prompt }) {
      try {
        console.log(
          '🔍 Chroma agent doGenerate called with prompt:',
          JSON.stringify(prompt, null, 2),
        );

        // Convert AI SDK prompt format to UIMessage format
        const messages = convertPromptToMessages(prompt);
        console.log(
          '📝 Converted messages:',
          JSON.stringify(messages, null, 2),
        );

        const result = await agent.invoke({ messages });

        return {
          text: result.content,
          finishReason: 'stop' as const,
          usage: {
            promptTokens: 0, // You can implement token counting if needed
            completionTokens: 0,
          },
          rawCall: {
            rawPrompt: prompt,
            rawSettings: {},
          },
        };
      } catch (error) {
        console.error('❌ Chroma agent error:', error);
        throw error;
      }
    },

    async doStream({ prompt }) {
      try {
        console.log(
          '🔍 Chroma agent doStream called with prompt:',
          JSON.stringify(prompt, null, 2),
        );

        // Convert AI SDK prompt format to UIMessage format
        const messages = convertPromptToMessages(prompt);
        console.log(
          '📝 Converted messages:',
          JSON.stringify(messages, null, 2),
        );

        // If your agent supports streaming
        if (agent.stream) {
          const stream = agent.stream({ messages });

          return {
            stream: new ReadableStream({
              async start(controller) {
                try {
                  for await (const chunk of stream) {
                    controller.enqueue({
                      type: 'text-delta',
                      textDelta: chunk,
                    } as LanguageModelV1StreamPart);
                  }
                  controller.enqueue({
                    type: 'finish',
                    finishReason: 'stop',
                    usage: {
                      promptTokens: 0,
                      completionTokens: 0,
                    },
                  } as LanguageModelV1StreamPart);
                  controller.close();
                } catch (error) {
                  controller.error(error);
                }
              },
            }),
            rawCall: {
              rawPrompt: prompt,
              rawSettings: {},
            },
          };
        } else {
          // Fallback to non-streaming
          const result = await agent.invoke({ messages });

          return {
            stream: new ReadableStream({
              start(controller) {
                // Split the response into chunks for pseudo-streaming
                const words = result.content.split(' ');
                let index = 0;

                const pushChunk = () => {
                  if (index < words.length) {
                    controller.enqueue({
                      type: 'text-delta',
                      textDelta: `${words[index]} `,
                    } as LanguageModelV1StreamPart);
                    index++;
                    setTimeout(pushChunk, 50);
                  } else {
                    controller.enqueue({
                      type: 'finish',
                      finishReason: 'stop',
                      usage: {
                        promptTokens: 0,
                        completionTokens: 0,
                      },
                    } as LanguageModelV1StreamPart);
                    controller.close();
                  }
                };

                pushChunk();
              },
            }),
            rawCall: {
              rawPrompt: prompt,
              rawSettings: {},
            },
          };
        }
      } catch (error) {
        console.error('❌ Chroma agent streaming error:', error);
        throw error;
      }
    },
  };
}

// Your actual ChromaDB + OpenAI regulatory AI implementation
export function createChromaAgent(): ChromaAgent {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Initialize ChromaDB client
  const client = new ChromaClient(getChromaConfig());

  return {
    async invoke({ messages }) {
      try {
        console.log(
          '🚀 ChromaAgent invoke called with messages:',
          JSON.stringify(messages, null, 2),
        );

        // Find the last user message for the query
        const userMessages = messages.filter((m) => m.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1];
        const question = lastUserMessage?.content?.trim() || '';

        console.log('❓ Extracted question:', question);

        if (!question) {
          return {
            content:
              'Please provide a question about Houston land development regulations.',
          };
        }

        // 1) Get collection
        console.log('📊 Getting ChromaDB collection...');
        const collection = await client.getCollection({ name: COLLECTION });

        // 2) Embed the question
        console.log('🧠 Creating embedding for question...');
        const emb = await openai.embeddings.create({
          model: EMBED_MODEL,
          input: question,
        });
        const q_emb = emb.data[0].embedding;

        // 3) Retrieve top-k relevant chunks
        console.log('🔍 Searching for relevant documents...');
        const results = await collection.query({
          queryEmbeddings: [q_emb],
          nResults: TOP_K,
          include: ['documents', 'metadatas'],
        });

        console.log('📋 Search results:', {
          documentsCount: results.documents[0]?.length || 0,
          metadatasCount: results.metadatas[0]?.length || 0,
        });

        const docs = results.documents[0] || [];
        const metas = results.metadatas[0] || [];

        if (docs.length === 0) {
          console.log('⚠️ No documents found in search results');
          return {
            content:
              'I could not find any relevant information in the Houston regulations database. Please ensure the database is properly populated.',
          };
        }

        // 4) Build prompt with citations
        const system_msg = `You are a regulatory AI assistant specializing in City of Houston land development regulations, including zoning ordinances (Chapter 42), subdivision rules, and building codes.`;

        const excerpts = metas.map((meta: any, i: number) => {
          const source = meta?.doc_name ?? 'Unknown';
          const citation = `[Source: ${source}]`;
          return `${citation}\n${docs[i]}`;
        });

        const user_prompt = `Use these excerpts to answer the question. Provide citations for each piece of information you use from the excerpts.\n\nExcerpts:\n${excerpts.join('\n\n---\n\n')}\n\nQUESTION: ${question}\n\nAnswer with specific sections and citations based *only* on the excerpts provided.`;

        console.log('🤖 Generating OpenAI response...');

        // 5) Generate answer
        const resp = await openai.chat.completions.create({
          model: CHAT_MODEL,
          messages: [
            { role: 'system', content: system_msg },
            { role: 'user', content: user_prompt },
          ],
          temperature: 0.0,
        });

        const answer = resp.choices[0].message.content;
        console.log('✅ Generated answer length:', answer?.length || 0);

        return {
          content:
            answer || 'I was unable to generate a response. Please try again.',
        };
      } catch (error) {
        console.error('❌ Chroma agent error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred';

        if (
          errorMessage.includes('Failed to connect') ||
          errorMessage.includes('fetch failed')
        ) {
          return {
            content:
              'Could not connect to ChromaDB. Please ensure it is running as a server via `chroma run --path ./chroma`.',
          };
        }

        return {
          content:
            'I apologize, but I encountered an error while processing your request. Please try again.',
        };
      }
    },

    // Implement streaming support
    async *stream({ messages }) {
      try {
        console.log(
          '🚀 ChromaAgent stream called with messages:',
          JSON.stringify(messages, null, 2),
        );

        // Find the last user message for the query
        const userMessages = messages.filter((m) => m.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1];
        const question = lastUserMessage?.content?.trim() || '';

        console.log('❓ Extracted question for streaming:', question);

        if (!question) {
          yield 'Please provide a question about Houston land development regulations.';
          return;
        }

        // Show progress to user
        yield 'Searching Houston land development regulations... ';

        // 1) Get collection
        const collection = await client.getCollection({ name: COLLECTION });

        // 2) Embed the question
        yield 'Analyzing your question... ';
        const emb = await openai.embeddings.create({
          model: EMBED_MODEL,
          input: question,
        });
        const q_emb = emb.data[0].embedding;

        // 3) Retrieve top-k relevant chunks
        yield 'Retrieving relevant documents... ';
        const results = await collection.query({
          queryEmbeddings: [q_emb],
          nResults: TOP_K,
          include: ['documents', 'metadatas'],
        });

        const docs = results.documents[0] || [];
        const metas = results.metadatas[0] || [];

        if (docs.length === 0) {
          yield 'I could not find any relevant information in the Houston regulations database. Please ensure the database is properly populated.';
          return;
        }

        // 4) Build prompt with citations
        const system_msg = `You are a regulatory AI assistant specializing in City of Houston land development regulations, including zoning ordinances (Chapter 42), subdivision rules, and building codes.`;

        const excerpts = metas.map((meta: any, i: number) => {
          const source = meta?.doc_name ?? 'Unknown';
          const citation = `[Source: ${source}]`;
          return `${citation}\n${docs[i]}`;
        });

        const user_prompt = `Use these excerpts to answer the question. Provide citations for each piece of information you use from the excerpts.\n\nExcerpts:\n${excerpts.join('\n\n---\n\n')}\n\nQUESTION: ${question}\n\nAnswer with specific sections and citations based *only* on the excerpts provided.`;

        // 5) Generate streaming answer
        yield 'Generating response...\n\n';

        const stream = await openai.chat.completions.create({
          model: CHAT_MODEL,
          messages: [
            { role: 'system', content: system_msg },
            { role: 'user', content: user_prompt },
          ],
          temperature: 0.0,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      } catch (error) {
        console.error('❌ Chroma agent streaming error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred';

        if (
          errorMessage.includes('Failed to connect') ||
          errorMessage.includes('fetch failed')
        ) {
          yield '\n\nError: Could not connect to ChromaDB. Please ensure it is running as a server via `chroma run --path ./chroma`.';
        } else {
          yield '\n\nError: I encountered an error while processing your request. Please try again.';
        }
      }
    },
  };
}
