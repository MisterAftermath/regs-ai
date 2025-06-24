/**
 * Building Code Agent - Main Export
 *
 * A specialized AI agent for answering questions about building codes,
 * zoning regulations, and land use requirements using a multi-phase pipeline:
 * Clarify → Retrieve → Verify → Synthesize → Review
 */

import type { BuildingCodeAgent, BuildingCodeConfig } from './types';
import { createBuildingCodeAgent as createRealAgent } from './agent';
import { createMockBuildingCodeAgent as createMockAgent } from './mock';
import { createBuildingCodeLanguageModel } from './wrapper';

/**
 * Creates a Building Code Agent instance
 * @param config - Configuration options
 * @returns BuildingCodeAgent instance
 */
export function createBuildingCodeAgent(
  config: BuildingCodeConfig = {},
): BuildingCodeAgent {
  // Use mock implementation if explicitly requested or in test environment
  const useMock = config.useMock ?? process.env.NODE_ENV === 'test';

  if (useMock) {
    console.log('🏗️ Using mock Building Code Agent');
    return createMockAgent();
  }

  return createRealAgent(config);
}

// Export types
export type {
  BuildingCodeAgent,
  BuildingCodeConfig,
  PipelineState,
  RetrievedDocument,
  VerifiedCitation,
  Source,
  BuildingCodeMetadata,
} from './types';

// Export wrapper for AI SDK compatibility
export { createBuildingCodeLanguageModel };

// Export pipeline phases for advanced usage
export * from './pipeline';

// Export configuration
export { config, validateConfig } from './config';
