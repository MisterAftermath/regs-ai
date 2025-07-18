/**
 * Clarification Phase Agent
 *
 * Analyzes user queries to extract parameters and identify missing information.
 * Can interactively ask clarifying questions before proceeding.
 */

import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config';
import { PHASE_PROMPTS } from '../prompts';
import type { ClarifyAgent, PipelineState } from '../types';
import type { CoreMessage } from 'ai';

export class ClarificationAgent implements ClarifyAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.models.planner,
      temperature: config.openai.temperature.planner,
    });
  }

  async execute({
    query,
    history,
  }: {
    query: string;
    history: CoreMessage[];
  }): Promise<PipelineState['clarifiedQuery']> {
    console.log('🔍 Clarification Phase: Analyzing query');

    try {
      // Build conversation context
      const messages = [
        { role: 'system' as const, content: PHASE_PROMPTS.clarify.system },
        ...history.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user' as const, content: query },
      ];

      // Get LLM response
      const response = await this.llm.invoke(messages);
      const result = JSON.parse(response.content as string);

      // If clarification is needed and we haven't hit the limit
      if (
        result.needsClarification &&
        config.features.interactiveClarification
      ) {
        // In a real implementation, this would trigger an interactive flow
        // For now, we'll log the questions and proceed with what we have
        console.log('❓ Clarifying questions:', result.clarifyingQuestions);
      }

      return result.extractedInfo;
    } catch (error) {
      console.error('❌ Clarification error:', error);

      // Fallback: return basic extraction
      return {
        question: query,
        context: { rawQuery: query },
      };
    }
  }
}

/**
 * Factory function for creating clarification agent
 */
export function createClarificationAgent(): ClarifyAgent {
  return new ClarificationAgent();
}
