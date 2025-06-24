/**
 * Building Code Pipeline Orchestrator
 *
 * Coordinates the execution of all pipeline phases:
 * Clarify → Retrieve → Verify → Synthesize → Review
 */

import { config, validateConfig } from '../config';
import type { PipelineState, Source } from '../types';
import { BuildingCodeError } from '../types';
import type { CoreMessage } from 'ai';

// Import phase agents
import { createClarificationAgent } from './clarify';
import { createRetrievalAgent } from './retrieve';
import { createVerificationAgent } from './verify';
import { createSynthesisAgent } from './synthesize';
import { extractTextFromContent } from '@/lib/utils';

type PhaseTimings = {
  clarify: number;
  retrieve: number;
  verify: number;
  synthesize: number;
  review: number;
};

/**
 * Execute the complete building code pipeline
 */
export async function executePipeline(
  messages: CoreMessage[],
  options?: {
    skipClarification?: boolean;
    includeConfidence?: boolean;
    maxSources?: number;
  },
): Promise<{
  content: string;
  sources?: Source[];
  confidence?: number;
  state?: PipelineState;
}> {
  console.log('\n🚀 Starting Building Code Pipeline');

  // Validate configuration
  const configValid = validateConfig();
  if (!configValid) {
    console.warn('⚠️  Running with incomplete configuration');
  }

  // Initialize pipeline state
  const state: PipelineState = {
    originalQuery: extractTextFromContent(
      messages[messages.length - 1]?.content,
    ),
    clarifiedQuery: {
      question: '',
    },
    retrievedDocuments: [],
    verifiedCitations: [],
    metadata: {
      startTime: Date.now(),
      phaseTimings: {
        clarify: 0,
        retrieve: 0,
        verify: 0,
        synthesize: 0,
        review: 0,
      },
      errors: [],
    },
  };

  let currentPhase: keyof PhaseTimings = 'clarify';

  try {
    // Phase 1: Clarification
    if (!options?.skipClarification) {
      const clarifyStart = Date.now();
      console.log('\n📋 Phase 1: Clarification');

      const clarifyAgent = createClarificationAgent();
      state.clarifiedQuery = await clarifyAgent.execute({
        query: state.originalQuery,
        history: messages.slice(0, -1),
      });

      state.metadata.phaseTimings.clarify = Date.now() - clarifyStart;
      console.log(
        `   ✅ Clarified in ${state.metadata.phaseTimings.clarify}ms`,
      );
      console.log(
        `   Municipality: ${state.clarifiedQuery.municipality || 'Not specified'}`,
      );
    } else {
      // Skip clarification - use raw query
      state.clarifiedQuery = {
        question: state.originalQuery,
      };
    }

    // Phase 2: Retrieval
    currentPhase = 'retrieve';
    const retrieveStart = Date.now();
    console.log('\n📚 Phase 2: Retrieval');

    const retrieveAgent = createRetrievalAgent();
    state.retrievedDocuments = await retrieveAgent.execute({
      clarifiedQuery: state.clarifiedQuery,
    });

    state.metadata.phaseTimings.retrieve = Date.now() - retrieveStart;
    console.log(
      `   ✅ Retrieved ${state.retrievedDocuments.length} documents in ${state.metadata.phaseTimings.retrieve}ms`,
    );

    // Phase 3: Verification
    currentPhase = 'verify';
    const verifyStart = Date.now();
    console.log('\n✅ Phase 3: Verification');

    const verifyAgent = createVerificationAgent();
    state.verifiedCitations = await verifyAgent.execute({
      documents: state.retrievedDocuments,
      query: state.clarifiedQuery,
    });

    state.metadata.phaseTimings.verify = Date.now() - verifyStart;
    const verifiedCount = state.verifiedCitations.filter(
      (c) => c.isValid,
    ).length;
    console.log(
      `   ✅ Verified ${verifiedCount}/${state.verifiedCitations.length} citations in ${state.metadata.phaseTimings.verify}ms`,
    );

    // Phase 4: Synthesis
    currentPhase = 'synthesize';
    const synthesizeStart = Date.now();
    console.log('\n🔨 Phase 4: Synthesis');

    const synthesizeAgent = createSynthesisAgent();
    state.synthesizedResponse = await synthesizeAgent.execute({
      query: state.clarifiedQuery,
      citations: state.verifiedCitations,
      documents: state.retrievedDocuments,
    });

    state.metadata.phaseTimings.synthesize = Date.now() - synthesizeStart;
    console.log(
      `   ✅ Synthesized response in ${state.metadata.phaseTimings.synthesize}ms`,
    );

    // Phase 5: Review (placeholder for future implementation)
    currentPhase = 'review';
    state.metadata.phaseTimings.review = 0;

    // Calculate total time
    const totalTime = Date.now() - state.metadata.startTime;
    console.log(`\n✅ Pipeline completed in ${totalTime}ms`);

    if (!state.synthesizedResponse) {
      throw new BuildingCodeError(
        'Pipeline completed without a response.',
        currentPhase,
        'INTERNAL_ERROR',
        { state },
      );
    }

    console.log(
      `   Confidence: ${(state.synthesizedResponse.confidence * 100).toFixed(0)}%`,
    );

    // Return results
    const result: {
      content: string;
      sources?: Source[];
      confidence?: number;
      state?: PipelineState;
    } = {
      content: state.synthesizedResponse.content,
      sources: options?.maxSources
        ? state.synthesizedResponse.sources.slice(0, options.maxSources)
        : state.synthesizedResponse.sources,
    };

    if (options?.includeConfidence) {
      result.confidence = state.synthesizedResponse.confidence;
    }

    // Include full state in development
    if (config.logging.level === 'debug') {
      result.state = state;
    }

    return result;
  } catch (error) {
    console.error(`\n❌ Pipeline error during '${currentPhase}' phase:`, error);

    // Log error to state
    state.metadata.errors.push({
      phase: currentPhase,
      error: error instanceof Error ? error.message : String(error),
    });

    // Re-throw as BuildingCodeError
    if (error instanceof Error) {
      throw new BuildingCodeError(
        error.message,
        currentPhase,
        'PIPELINE_ERROR',
        { state },
      );
    }

    throw error;
  }
}

/**
 * Stream the pipeline execution
 * Note: This is a simplified streaming implementation
 */
export async function* streamPipeline(
  messages: CoreMessage[],
  options?: {
    skipClarification?: boolean;
    includeConfidence?: boolean;
    maxSources?: number;
  },
): AsyncGenerator<string, void, unknown> {
  try {
    // Status updates during execution
    yield '🔍 Analyzing your building code question...\n\n';

    // Execute pipeline
    const result = await executePipeline(messages, options);

    // Stream the response
    const words = result.content.split(' ');
    for (const word of words) {
      yield `${word} `;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    // Add sources section if available
    if (result.sources && result.sources.length > 0) {
      yield '\n\n---\n\n**Sources:**\n';
      for (const source of result.sources) {
        yield `- ${source.citation}`;
        if (source.page) {
          yield ` (Page ${source.page})`;
        }
        yield '\n';
      }
    }

    // Add confidence if requested
    if (options?.includeConfidence && result.confidence !== undefined) {
      yield `\n**Confidence:** ${(result.confidence * 100).toFixed(0)}%\n`;
    }
  } catch (error) {
    console.error('❌ Streaming error:', error);
    yield '\n\n❌ An error occurred while processing your request. Please try again.';
  }
}
