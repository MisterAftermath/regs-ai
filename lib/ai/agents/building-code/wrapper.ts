/**
 * Vercel AI SDK Wrapper for Building Code Agent
 *
 * This wrapper makes the pipeline-based Building Code Agent compatible with
 * Vercel's AI SDK by implementing the LanguageModelV1 interface.
 */

import type {
  LanguageModelV1,
  LanguageModelV1CallWarning,
  LanguageModelV1FinishReason,
  LanguageModelV1StreamPart,
} from '@ai-sdk/provider';
import type { BuildingCodeAgent } from './types';

/**
 * Creates a Vercel AI SDK compatible wrapper for the Building Code Agent
 * @param agent - The Building Code Agent instance
 * @returns A LanguageModelV1 compatible model
 */
export function createBuildingCodeLanguageModel(
  agent: BuildingCodeAgent,
): LanguageModelV1 {
  return {
    // Model metadata
    provider: 'building-code-agent',
    modelId: 'pipeline-v1',
    specificationVersion: 'v1',
    defaultObjectGenerationMode: undefined,

    /**
     * Generate a response using the pipeline
     */
    async doGenerate(options) {
      console.log('🔧 AI SDK Wrapper: doGenerate called');

      // Convert messages to our format
      const messages = options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content[0]?.type === 'text' ? msg.content[0].text : '',
      }));

      // Extract options
      const agentOptions = {
        skipClarification: options.temperature === 0, // Use temperature=0 to skip clarification
        includeConfidence: true,
        maxSources: 5,
      };

      // Call the agent
      const result = await agent.invoke({ messages, options: agentOptions });

      // Format response for AI SDK
      return {
        finishReason: 'stop' as LanguageModelV1FinishReason,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
        },
        text: result.content,
        rawCall: {
          rawPrompt: null,
          rawSettings: {},
        },
        warnings: [] as LanguageModelV1CallWarning[],
      };
    },

    /**
     * Stream a response using the pipeline
     */
    async doStream(options) {
      console.log('🔧 AI SDK Wrapper: doStream called');

      // Convert messages
      const messages = options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content[0]?.type === 'text' ? msg.content[0].text : '',
      }));

      // Extract options
      const agentOptions = {
        skipClarification: options.temperature === 0,
        includeConfidence: true,
        maxSources: 5,
      };

      // Create stream
      return {
        stream: createAsyncIterableStream(
          agent.stream!({ messages, options: agentOptions }),
        ),
        rawCall: {
          rawPrompt: null,
          rawSettings: {},
        },
        warnings: [] as LanguageModelV1CallWarning[],
      };
    },
  };
}

/**
 * Helper to create an async iterable stream compatible with AI SDK
 */
async function* createAsyncIterableStream(
  agentStream: AsyncGenerator<string, void, unknown>,
): AsyncGenerator<LanguageModelV1StreamPart, void, unknown> {
  let buffer = '';

  try {
    for await (const chunk of agentStream) {
      buffer += chunk;

      // Emit text delta
      yield {
        type: 'text-delta',
        textDelta: chunk,
      };
    }

    // Emit finish
    yield {
      type: 'finish',
      finishReason: 'stop',
      usage: {
        promptTokens: 0,
        completionTokens: buffer.length,
      },
    };
  } catch (error) {
    // Emit error
    yield {
      type: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
