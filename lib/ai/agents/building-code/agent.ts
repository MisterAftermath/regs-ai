/**
 * Building Code Agent - Pipeline Implementation
 *
 * This is the main entry point for the building code agent.
 * It uses a multi-phase pipeline architecture:
 * Clarify → Retrieve → Verify → Synthesize → Review
 */

import type { BuildingCodeAgent, BuildingCodeConfig } from './types';
import { executePipeline, streamPipeline } from './pipeline';
import { config } from './config';

/**
 * Creates a pipeline-based Building Code Agent
 * @param agentConfig - Configuration options for the agent
 * @returns A BuildingCodeAgent instance
 */
export function createBuildingCodeAgent(
  agentConfig: BuildingCodeConfig = {},
): BuildingCodeAgent {
  console.log('🏗️ Initializing Building Code Agent (Pipeline Architecture)');

  // Log configuration status
  if (config.logging.level === 'debug') {
    console.log('Configuration:', {
      vectorDB: config.vectorDB.provider,
      s3Configured: !!config.s3.accessKeyId,
      pdfSearch: config.pdfProcessing.searchProvider,
      features: config.features,
    });
  }

  return {
    /**
     * Process a query through the pipeline and return a response
     */
    async invoke({ messages, options }) {
      console.log('\n🏗️ Building Code Agent invoked');

      // Validate messages
      if (!messages || messages.length === 0) {
        return {
          content:
            'Please provide a question about building codes or zoning regulations.',
        };
      }

      try {
        // Execute the pipeline
        const result = await executePipeline(messages, options);

        return {
          content: result.content,
          sources: result.sources,
        };
      } catch (error) {
        console.error('❌ Agent error:', error);

        // Provide helpful error message
        let errorMessage =
          'I apologize, but I encountered an error while processing your building code query.';

        if (error instanceof Error) {
          if (error.message.includes('API key')) {
            errorMessage += ' Please ensure the OpenAI API key is configured.';
          } else if (error.message.includes('vector')) {
            errorMessage +=
              ' The building codes database is currently unavailable.';
          } else {
            errorMessage += ` Error: ${error.message}`;
          }
        }

        return {
          content: errorMessage,
        };
      }
    },

    /**
     * Stream a response through the pipeline
     */
    async *stream({ messages, options }) {
      console.log('\n🏗️ Building Code Agent streaming');

      // Validate messages
      if (!messages || messages.length === 0) {
        yield 'Please provide a question about building codes or zoning regulations.';
        return;
      }

      try {
        // Use the streaming pipeline
        yield* streamPipeline(messages, options);
      } catch (error) {
        console.error('❌ Streaming error:', error);
        yield '\n\n❌ An error occurred while processing your request. Please try again.';
      }
    },
  };
}
