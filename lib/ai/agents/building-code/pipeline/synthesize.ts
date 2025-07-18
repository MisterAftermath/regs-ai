/**
 * Synthesis Phase Agent
 *
 * Takes verified citations and creates a comprehensive, well-formatted response
 * with proper citations and source references.
 */

import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config';
import { PHASE_PROMPTS } from '../prompts';
import type {
  SynthesizeAgent,
  PipelineState,
  VerifiedCitation,
  RetrievedDocument,
  Source,
} from '../types';

export class SynthesisAgent implements SynthesizeAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.models.synthesizer,
      temperature: config.openai.temperature.synthesizer,
    });
  }

  async execute({
    query,
    citations,
    documents,
    annotations,
  }: {
    query: PipelineState['clarifiedQuery'];
    citations: VerifiedCitation[];
    documents: RetrievedDocument[];
    annotations?: string;
  }): Promise<PipelineState['synthesizedResponse']> {
    console.log('🔨 Synthesis Phase: Creating response');

    if (annotations) {
      console.log('📌 Found annotations to apply');
    }

    try {
      // Sort citations: verified first, then unverified
      const sortedCitations = [...citations].sort((a, b) => {
        if (a.isValid && !b.isValid) return -1;
        if (!a.isValid && b.isValid) return 1;
        return b.confidence - a.confidence;
      });

      // Build context for LLM with ALL citations
      const citationContext = this.buildCitationContext(sortedCitations);

      // Create the base prompt
      const baseUserPrompt = `
Query: ${query.question}
Municipality: ${query.municipality || 'Not specified'}
Property Type: ${query.propertyType || 'Not specified'}

Verified Citations:
${citationContext}

Please provide a comprehensive answer to the query using only the information from these citations.
      `.trim();

      // Sandwich annotations around user prompt if present
      const userPrompt = annotations
        ? `${annotations}\n\n${baseUserPrompt}\n\n${annotations}`
        : baseUserPrompt;

      // Create system prompt with annotations sandwich
      const baseSystemPrompt = PHASE_PROMPTS.synthesize.system;
      const systemPrompt = annotations
        ? `${annotations}\n\n${baseSystemPrompt}\n\n${annotations}`
        : baseSystemPrompt;

      // Get LLM response
      const response = await this.llm.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      // Calculate overall confidence
      const overallConfidence = this.calculateConfidence(citations);

      // Build sources for UI
      const sources = this.buildSources(sortedCitations);

      return {
        content: response.content as string,
        confidence: overallConfidence,
        sources,
      };
    } catch (error) {
      console.error('❌ Synthesis error:', error);
      throw error;
    }
  }

  private buildCitationContext(citations: VerifiedCitation[]): string {
    return citations
      .map((citation, index) => {
        const num = index + 1;
        const status = citation.isValid ? '✓' : '⚠️';
        const source = citation.source.documentId.startsWith('user-')
          ? '[Company Document]'
          : '';

        return `
${num}. ${status} ${citation.citation} ${source}
   Content: "${citation.content}"
   Confidence: ${(citation.confidence * 100).toFixed(0)}%
   ${!citation.isValid ? '   (Unverified - use with caution)' : ''}
        `.trim();
      })
      .join('\n\n');
  }

  private calculateConfidence(citations: VerifiedCitation[]): number {
    if (citations.length === 0) return 0;

    // Weight verified citations more heavily
    const weights = citations.map((c) => (c.isValid ? 1.5 : 0.5));
    const weightedSum = citations.reduce(
      (sum, c, i) => sum + c.confidence * weights[i],
      0,
    );
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    return weightedSum / totalWeight;
  }

  private buildSources(citations: VerifiedCitation[]): Source[] {
    // Limit to configured max sources
    const limitedCitations = citations.slice(0, config.response.maxSources);

    return limitedCitations.map((citation) => {
      const source: Source = {
        title: citation.citation,
        citation: citation.citation,
        excerpt:
          citation.content.length > 200
            ? `${citation.content.substring(0, 200)}...`
            : citation.content,
        documentUrl: citation.source.s3Url || '#',
        page: citation.source.page,
      };

      // Add highlights if available
      if (citation.source.coordinates) {
        source.highlights = [
          {
            text: citation.content,
            coordinates: citation.source.coordinates,
          },
        ];
      }

      return source;
    });
  }
}

/**
 * Factory function for creating synthesis agent
 */
export function createSynthesisAgent(): SynthesizeAgent {
  return new SynthesisAgent();
}
