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
  LanguageModelV1CallOptions,
  LanguageModelV1Message,
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
    async doGenerate(options: LanguageModelV1CallOptions) {
      console.log('🔧 AI SDK Wrapper: doGenerate called');

      // Convert messages to our format
      const messages = options.prompt
        .filter(
          (
            msg,
          ): msg is LanguageModelV1Message & { role: 'user' | 'assistant' } =>
            msg.role === 'user' || msg.role === 'assistant',
        )
        .map((msg) => {
          let content = '';
          if (typeof msg.content === 'string') {
            content = msg.content;
          } else {
            const textPart = msg.content.find((part) => part.type === 'text');
            if (textPart && 'text' in textPart) {
              content = textPart.text;
            }
          }
          return {
            role: msg.role,
            content,
          };
        });

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
    async doStream(options: LanguageModelV1CallOptions) {
      console.log('🔧 AI SDK Wrapper: doStream called');

      // Convert messages
      const messages = options.prompt
        .filter(
          (
            msg,
          ): msg is LanguageModelV1Message & { role: 'user' | 'assistant' } =>
            msg.role === 'user' || msg.role === 'assistant',
        )
        .map((msg) => {
          let content = '';
          if (typeof msg.content === 'string') {
            content = msg.content;
          } else {
            const textPart = msg.content.find((part) => part.type === 'text');
            if (textPart && 'text' in textPart) {
              content = textPart.text;
            }
          }
          return {
            role: msg.role,
            content,
          };
        });

      // Extract options
      const agentOptions = {
        skipClarification: options.temperature === 0,
        includeConfidence: true,
        maxSources: 5,
      };

      if (!agent.stream) {
        throw new Error('This agent does not support streaming.');
      }

      // Create stream
      return {
        stream: createSdkStream(
          agent.stream({ messages, options: agentOptions }),
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
 * Helper to create a ReadableStream compatible with AI SDK from an AsyncGenerator
 */
function createSdkStream(
  agentStream: AsyncGenerator<string, void, unknown>,
): ReadableStream<LanguageModelV1StreamPart> {
  return new ReadableStream<LanguageModelV1StreamPart>({
    async start(controller) {
      let buffer = '';
      try {
        for await (const chunk of agentStream) {
          buffer += chunk;
          controller.enqueue({
            type: 'text-delta',
            textDelta: chunk,
          });
        }
        controller.enqueue({
          type: 'finish',
          finishReason: 'stop',
          usage: {
            promptTokens: 0,
            completionTokens: buffer.length,
          },
        });
      } catch (error) {
        controller.enqueue({
          type: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      } finally {
        controller.close();
      }
    },
  });
}
